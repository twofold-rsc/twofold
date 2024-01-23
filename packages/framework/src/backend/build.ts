import { context } from "esbuild";
import { readFile, rm, watch } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { appCompiledDir, frameworkSrcDir } from "./files.js";
import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import * as astring from "astring";
import type {
  FunctionDeclaration,
  ExportNamedDeclaration,
  Program,
} from "estree";
import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import { BrowserAppBuilder } from "./build/browser-app-builder.js";
import {
  ClientComponentOutput,
  clientComponentMapPlugin,
} from "./build/plugins/client-component-map-plugin.js";
import { RSCBuilder } from "./build/rsc-builder.js";
import * as path from "node:path";
import { ErrorPageBuilder } from "./build/error-page-builder.js";

class BuildEvents extends EventEmitter {}

export class Build {
  #key = randomBytes(6).toString("hex");
  #isBuilding = false;
  #errorPageBuilder: ErrorPageBuilder;
  #rscBuilder: RSCBuilder;
  #serverActionsBuilder: ServerActionsBuilder;
  #browserAppBuilder: BrowserAppBuilder;
  #ssrAppBuilder?: SSRAppBuilder;
  #events = new BuildEvents();
  #previousChunks = new Set<string>();
  #previousRSCFiles = new Set<string>();

  constructor() {
    this.#errorPageBuilder = new ErrorPageBuilder();
    this.#rscBuilder = new RSCBuilder();
    this.#serverActionsBuilder = new ServerActionsBuilder();
    this.#browserAppBuilder = new BrowserAppBuilder({
      rscBuilder: this.#rscBuilder,
    });
  }

  get isBuilding() {
    return this.#isBuilding;
  }

  get key() {
    return this.#key;
  }

  async setup() {
    await this.#errorPageBuilder.setup();
    await this.#rscBuilder.setup();
    await this.#serverActionsBuilder.setup();
  }

  get errorPage() {
    return this.#errorPageBuilder;
  }

  get rsc() {
    return this.#rscBuilder;
  }

  get actions() {
    return this.#serverActionsBuilder;
  }

  get error() {
    return (
      this.#rscBuilder.error ||
      this.#browserAppBuilder.error ||
      this.#ssrAppBuilder?.error
    );
  }

  get apps() {
    if (!this.#browserAppBuilder || !this.#ssrAppBuilder) {
      throw new Error("Apps not built");
    }

    return {
      browser: this.#browserAppBuilder,
      ssr: this.#ssrAppBuilder,
    };
  }

  async build() {
    performance.mark("build start");

    if (this.#isBuilding) {
      // i need to figure this out
      return;
    }

    this.#isBuilding = true;

    // stash old chunks so we can see what changed
    if (!this.error) {
      let clientComponentMapKeys = Object.keys(this.clientComponentMap);
      this.#previousChunks = new Set<string>();
      for (let key of clientComponentMapKeys) {
        let chunks = this.clientComponentMap[key].chunks;
        for (let chunk of chunks) {
          this.#previousChunks.add(chunk);
        }
      }

      this.#previousRSCFiles = new Set(this.#rscBuilder.files);
    } else {
      this.#previousChunks = new Set();
      this.#previousRSCFiles = new Set();
    }

    await this.#errorPageBuilder.build();
    await this.#rscBuilder.build();
    await this.#serverActionsBuilder.build();
    await this.#browserAppBuilder.build();

    this.#ssrAppBuilder = new SSRAppBuilder({
      clientComponents: this.#rscBuilder.clientComponents,
    });

    await this.#ssrAppBuilder.setup();
    await this.#ssrAppBuilder.build();

    this.#key = randomBytes(6).toString("hex");

    performance.mark("build end");

    let measure = performance.measure(
      "build duration",
      "build start",
      "build end",
    );
    let rebuildTime = measure.duration;

    console.log(
      `🏗️  Built app in ${rebuildTime.toFixed(2)}ms [version: ${this.#key}]`,
    );

    this.#isBuilding = false;

    this.#events.emit("complete");
  }

  get events() {
    return this.#events;
  }

  get clientComponentModuleMap() {
    // moduleId -> {
    //   server: outputFile
    //   browser: outputFile
    // }

    let browserOutputMap = this.#browserAppBuilder?.clientComponentOutputMap;
    let serverOutputMap = this.#ssrAppBuilder?.clientComponentOutputMap;

    if (!browserOutputMap || !serverOutputMap) {
      return {};
    }

    let clientComponents = Array.from(this.#rscBuilder.clientComponents);

    let clientComponentModuleMap = new Map<
      string,
      {
        server?: string;
        browser?: string;
      }
    >();

    for (let clientComponent of clientComponents) {
      let { moduleId, path } = clientComponent;
      clientComponentModuleMap.set(moduleId, {
        server: serverOutputMap.get(path)?.outputPath,
        browser: browserOutputMap.get(path)?.outputPath,
      });
    }

    return Object.fromEntries(clientComponentModuleMap.entries());
  }

  get clientComponentMap() {
    let browserOutputMap = this.#browserAppBuilder?.clientComponentOutputMap;
    let serverOutputMap = this.#ssrAppBuilder?.clientComponentOutputMap;

    if (!browserOutputMap || !serverOutputMap) {
      return {};
    }

    let clientComponents = Array.from(this.#rscBuilder.clientComponents);
    let clientComponentMap = new Map<
      string,
      {
        id: string;
        chunks: string[];
        name: string;
        async: false;
      }
    >();

    for (let clientComponent of clientComponents) {
      let { moduleId, path } = clientComponent;

      let browserOutput = browserOutputMap.get(path);
      let serverOutput = serverOutputMap.get(path);

      if (!browserOutput || !serverOutput) {
        throw new Error("Missing output");
      }

      if (browserOutput.name !== serverOutput.name) {
        throw new Error("Mismatched output names");
      }

      // [moduleId:name:browserHash:serverHash]
      let chunk = `${moduleId}:${browserOutput.name}:${browserOutput.hash}:${serverOutput.hash}`;

      for (let exportName of clientComponent.exports) {
        let id = `${moduleId}#${exportName}`;

        clientComponentMap.set(id, {
          id,
          chunks: [chunk],
          name: exportName,
          async: false,
        });
      }
    }

    return Object.fromEntries(clientComponentMap.entries());
  }

  // rename this
  get newChunks() {
    let clientComponentMapKeys = Object.keys(this.clientComponentMap);
    let newChunks = new Set<string>();
    for (let key of clientComponentMapKeys) {
      let chunks = this.clientComponentMap[key].chunks;
      for (let chunk of chunks) {
        if (!this.#previousChunks.has(chunk)) {
          newChunks.add(chunk);
        }
      }
    }
    return newChunks;
  }

  private newRSCFiles(extension: string) {
    let newRSCs = new Set<string>();
    let RSCs = this.#rscBuilder.files.filter((file) =>
      file.endsWith(`.${extension}`),
    );
    for (let key of RSCs) {
      if (!this.#previousRSCFiles.has(key)) {
        newRSCs.add(key);
      }
    }

    return newRSCs;
  }

  get newRSCs() {
    return this.newRSCFiles("js");
  }

  get newCSSFiles() {
    return this.newRSCFiles("css");
  }

  async watch() {
    let watched = watch("./src", { recursive: true });
    for await (const event of watched) {
      await this.build();
    }
  }
}

export type BuildContext = Awaited<ReturnType<typeof context>>;
export type BuildMetafile = Awaited<
  ReturnType<BuildContext["rebuild"]>
>["metafile"];

type ClientComponent = {
  moduleId: string;
  path: string;
  exports: string[];
};

class ServerActionsBuilder {
  #context?: BuildContext;
  #serverActions = new Set<string>();

  async setup() {
    let builder = this;

    this.#context = await context({
      format: "esm",
      logLevel: "error",
      entryPoints: ["./.twofold/rsc/js/**/*.js"],
      outdir: "./.twofold/rsc/js/",
      outbase: "./.twofold/rsc/js/",
      allowOverwrite: true,
      plugins: [
        {
          name: "rsc-actions",
          setup(build) {
            let rscDir = new URL("./rsc/js/", appCompiledDir);

            build.onLoad({ filter: /\.js$/ }, async ({ path }) => {
              let module = path
                .slice(fileURLToPath(rscDir).length)
                .replace(/\.[^/.]+$/, "");

              // console.log("rsc-actions onLoad processing", path);
              const contents = await readFile(path, "utf-8");

              type State = {
                actions: FunctionDeclaration[];
                exports: ExportNamedDeclaration[];
              };

              let state: State = {
                actions: [],
                exports: [],
              };

              let ast = acorn.parse(contents, {
                ecmaVersion: "latest",
                sourceType: "module",
              });

              acornWalk.ancestor(ast, {
                FunctionDeclaration(_node, _, ancestors) {
                  let node = _node as unknown as FunctionDeclaration;
                  if (
                    node.body.type === "BlockStatement" &&
                    node.body.body[0]
                  ) {
                    let firstStatement = node.body.body[0];
                    if (
                      firstStatement.type === "ExpressionStatement" &&
                      firstStatement.expression.type === "Literal" &&
                      firstStatement.expression.value === "use server"
                    ) {
                      // console.log("Found a use server");
                      // console.log(node);
                      // console.log(state);
                      // console.log(ancestors);

                      // verify top level
                      // todo

                      // save state
                      state.actions.push(node);
                    }
                  }
                },
                ExportNamedDeclaration(node) {
                  state.exports.push(node as unknown as ExportNamedDeclaration);
                },
              });

              for (let node of state.actions) {
                let index = (ast as unknown as Program).body.indexOf(node);
                let name = node.id?.name;

                if (!name) {
                  // todo
                  throw new Error("No name found");
                }

                // export action from another module
                let referenceCode = `
                ${name}.$$typeof = Symbol.for("react.server.reference");
                ${name}.$$id = "${module}#${name}";
                ${name}.$$bound = null;
                `;

                builder.#serverActions.add(`${module}#${name}`);

                let tree = acorn.parse(referenceCode, {
                  ecmaVersion: "latest",
                });

                for (let exportNode of state.exports) {
                  let specifiers = exportNode.specifiers;

                  let isExported = specifiers.some((specifier) => {
                    return (
                      specifier.exported.name === name &&
                      specifier.local.name === name
                    );
                  });

                  // make sure this name isn't already exported as something else

                  if (!isExported) {
                    exportNode.specifiers.push({
                      type: "ExportSpecifier",
                      local: { type: "Identifier", name: name },
                      exported: { type: "Identifier", name: name },
                    });
                  }
                }

                ast.body.splice(index + 1, 0, ...tree.body);
              }

              return {
                contents: astring.generate(ast),
                loader: "js",
              };
            });
          },
        },
      ],
    });
  }

  async build() {
    this.#serverActions = new Set();
    await this.#context?.rebuild();
  }

  isAction(id: string) {
    return this.#serverActions.has(id);
  }

  async runAction(id: string, args: any[]) {
    let [moduleName, exportName] = id.split("#");

    if (!moduleName || !exportName || !this.isAction(id)) {
      throw new Error("Invalid action id");
    }

    let rscDir = new URL("./rsc/js/", appCompiledDir);
    let modulePath = new URL(`${moduleName}.js`, rscDir).href;
    let module = await import(modulePath);
    let action = module[exportName];

    return action.apply(null, args);
  }
}

class SSRAppBuilder {
  #context?: BuildContext;
  #metafile?: BuildMetafile;
  #error?: Error;
  #clientComponents = new Set<ClientComponent>();
  #clientComponentOutputMap = new Map<string, ClientComponentOutput>();

  constructor({
    clientComponents,
  }: {
    clientComponents: Set<ClientComponent>;
  }) {
    this.#clientComponents = clientComponents;
  }

  get clientEntryPoints() {
    return Array.from(this.#clientComponents).map(
      (component) => component.path,
    );
  }

  get clientComponentOutputMap() {
    return this.#clientComponentOutputMap;
  }

  set clientComponentOutputMap(map: Map<string, ClientComponentOutput>) {
    this.#clientComponentOutputMap = map;
  }

  async setup() {
    this.#context = await context({
      bundle: true,
      splitting: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints: [...this.clientEntryPoints, this.srcAppPath],
      outdir: "./.twofold/ssr-app/",
      outbase: "src",
      entryNames: "entries/[name]-[hash]",
      chunkNames: "chunks/[name]-[hash]",
      external: ["react", "react-dom"],
      metafile: true,
      plugins: [clientComponentMapPlugin({ builder: this })],
    });
  }

  async build() {
    this.#metafile = undefined;
    try {
      let results = await this.#context?.rebuild();
      this.#metafile = results?.metafile;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        this.#error = error;
      } else {
        this.#error = new Error("Unknown error");
      }
    }
  }

  get files() {
    let metafile = this.#metafile;

    if (!metafile) {
      throw new Error("Failed to get metafile");
    }

    return Object.keys(metafile.outputs);
  }

  get error() {
    return this.#error;
  }

  private get srcAppPath() {
    return fileURLToPath(new URL("./clients/ssr/ssr-app.tsx", frameworkSrcDir));
  }

  private getCompiledEntryPoint(entryPointPath: string) {
    let base = process.cwd();
    let metafile = this.#metafile;

    if (!metafile) {
      throw new Error("Failed to get metafile");
    }

    let outputs = metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let file = outputFiles.find((outputFile) => {
      let entryPoint = outputs[outputFile].entryPoint;
      if (entryPoint) {
        let fullEntryPointPath = path.join(base, entryPoint);
        return fullEntryPointPath === entryPointPath;
      }
    });

    if (!file) {
      throw new Error(`Failed to get compiled entry point: ${entryPointPath}`);
    }

    return path.join(base, file);
  }

  get appPath() {
    return this.getCompiledEntryPoint(this.srcAppPath);
  }
}
