import { context } from "esbuild";
import { watch } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { frameworkSrcDir } from "./files.js";
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
  #browserAppBuilder: BrowserAppBuilder;
  #ssrAppBuilder?: SSRAppBuilder;
  #events = new BuildEvents();
  #previousChunks = new Set<string>();
  #previousRSCFiles = new Set<string>();

  constructor() {
    this.#errorPageBuilder = new ErrorPageBuilder();
    this.#rscBuilder = new RSCBuilder();
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
  }

  get errorPage() {
    return this.#errorPageBuilder;
  }

  get rsc() {
    return this.#rscBuilder;
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
