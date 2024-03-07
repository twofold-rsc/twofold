import { build, transform } from "esbuild";
import { BuildMetafile } from "../build";
import {
  clientComponentMapPlugin,
  ClientComponentOutput,
} from "./plugins/client-component-map-plugin.js";
import { readFile } from "fs/promises";
import { transformAsync } from "@babel/core";
import { fileURLToPath } from "url";
import { appSrcDir, frameworkSrcDir } from "../files.js";
import { dirname } from "path";
import * as path from "path";
import { getCompiledEntrypoint } from "./helpers/compiled-entrypoint.js";
import { EntriesBuilder } from "./entries-builder";
import { serverActionClientReferencePlugin } from "./plugins/server-action-client-reference-plugin.js";

export class ClientAppBuilder {
  #metafile?: BuildMetafile;
  #error?: Error;
  #entriesBuilder: EntriesBuilder;
  #clientComponentOutputMap = new Map<string, ClientComponentOutput>();

  constructor({ entriesBuilder }: { entriesBuilder: EntriesBuilder }) {
    this.#entriesBuilder = entriesBuilder;
  }

  get clientEntryPoints() {
    return Array.from(this.#entriesBuilder.clientComponentModuleMap.keys());
  }

  get entries() {
    return this.#entriesBuilder;
  }

  async build() {
    this.#metafile = undefined;
    this.#error = undefined;

    let builder = this;

    try {
      let results = await build({
        bundle: true,
        format: "esm",
        jsx: "automatic",
        logLevel: "error",
        entryPoints: [
          ...this.clientEntryPoints,
          this.initializeBrowserPath,
          this.srcSSRAppPath,
        ],
        entryNames: "entries/[name]-[hash]",
        outdir: "./.twofold/client-app/",
        outbase: "src",
        splitting: true,
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          serverActionClientReferencePlugin({ builder: builder }),
          clientComponentMapPlugin({
            clientEntryPoints: this.clientEntryPoints,
            setClientComponentOutputMap: (clientComponentOutputMap) => {
              this.#clientComponentOutputMap = clientComponentOutputMap;
            },
          }),
          {
            name: "react-refresh",
            setup(build) {
              let appSrcPath = fileURLToPath(appSrcDir);

              build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
                if (path.startsWith(appSrcPath)) {
                  let contents = await readFile(path, "utf-8");

                  let moduleName = path
                    .slice(appSrcPath.length)
                    .replace(/\.tsx$/, "");

                  // esbuild transform ts to js
                  let { code } = await transform(contents, {
                    loader: "tsx",
                    jsx: "automatic",
                    format: "esm",
                  });

                  // babel transform
                  let result = await transformAsync(code, {
                    plugins: ["react-refresh/babel"],
                    configFile: false,
                    babelrc: false,
                  });

                  if (result?.code && /\$RefreshReg\$\(/.test(result.code)) {
                    let start = `
                      let prevRefreshReg = undefined;
                      let prevRefreshSig = undefined;
                      if (typeof window !== 'undefined') {
                        prevRefreshReg = window.$RefreshReg$;
                        prevRefreshSig = window.$RefreshSig$;
                        window.$RefreshReg$ = (type, refreshId) => {
                          let registerId = \`${moduleName} \${refreshId}\`;
                          window.$RefreshRuntime$.register(type, registerId);
                        };
                        window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
                      }
                    `;

                    let end = `
                      if (typeof window !== 'undefined') {
                        window.$RefreshReg$ = prevRefreshReg;
                        window.$RefreshSig$ = prevRefreshSig;
                      }
                    `;

                    return {
                      contents: `${start}\n${result.code}\n${end}`,
                      loader: "tsx",
                      resolveDir: dirname(path),
                    };
                  }
                }
              });
            },
          },
        ],
      });

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

  private get initializeBrowserPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./client-app/browser/initialize-browser.tsx", frameworkSrcDir),
    );

    return initializeBrowser;
  }

  private get srcSSRAppPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./client-app/ssr/ssr-app.tsx", frameworkSrcDir),
    );

    return initializeBrowser;
  }

  private get metafile() {
    if (!this.#metafile) {
      throw new Error("Failed to get metafile");
    }

    return this.#metafile;
  }

  get error() {
    return this.#error;
  }

  get bootstrapPath() {
    return getCompiledEntrypoint(this.initializeBrowserPath, this.metafile);
  }

  get bootstrapHash() {
    let file = path.basename(this.bootstrapPath);
    let nameWithoutExtension = file.split(".")[0] ?? file;
    let parts = nameWithoutExtension.split("-");
    let hash = parts.at(-1) ?? "";
    return hash;
  }

  get SSRAppPath() {
    return getCompiledEntrypoint(this.srcSSRAppPath, this.metafile);
  }

  get clientComponentModuleMap() {
    // moduleId -> {
    //   path: outputFile
    // }

    let outputMap = this.#clientComponentOutputMap;
    if (!outputMap) {
      return {};
    }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentModuleMap.values(),
    );
    let clientComponentModuleMap = new Map<
      string,
      {
        path?: string;
      }
    >();

    for (let clientComponent of clientComponents) {
      let { moduleId, path } = clientComponent;
      clientComponentModuleMap.set(moduleId, {
        path: outputMap.get(path)?.outputPath,
      });
    }

    return Object.fromEntries(clientComponentModuleMap.entries());
  }

  get clientComponentMap() {
    let outputMap = this.#clientComponentOutputMap;

    if (!outputMap) {
      return {};
    }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentModuleMap.values(),
    );
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

      let output = outputMap.get(path);
      if (!output) {
        throw new Error("Missing output");
      }

      // [moduleId:name:hash]
      let chunk = `${moduleId}:${output.name}:${output.hash}`;

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

  get chunks() {
    let outputs = this.metafile.outputs;
    let outputFiles = Object.keys(outputs);

    let chunkFiles = outputFiles.filter((outputFile) => {
      return /\/chunks\/chunk-[A-Z0-9]+\.js$/.test(outputFile);
    });

    return chunkFiles.map((chunkFile) => {
      let file = path.basename(chunkFile);
      let nameWithoutExtension = file.split(".")[0] ?? file;
      let parts = nameWithoutExtension.split("-");
      let hash = parts.at(-1) ?? "";
      return {
        hash,
        path: path.join(process.cwd(), chunkFile),
      };
    });
  }
}
