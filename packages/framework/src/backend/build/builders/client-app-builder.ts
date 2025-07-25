import { Metafile, build, transform } from "esbuild";
import {
  clientComponentMapPlugin,
  ClientComponentOutput,
} from "../plugins/client-component-map-plugin.js";
import { readFile } from "fs/promises";
import { transformAsync } from "@babel/core";
import { fileURLToPath } from "url";
import { appCompiledDir, appAppDir, frameworkSrcDir } from "../../files.js";
import { dirname } from "path";
import path from "path";
import { getCompiledEntrypoint } from "../helpers/compiled-entrypoint.js";
import { EntriesBuilder } from "./entries-builder.js";
import { serverActionClientReferencePlugin } from "../plugins/server-action-client-reference-plugin.js";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { Image, imagesPlugin } from "../plugins/images-plugin.js";

export class ClientAppBuilder extends Builder {
  readonly name = "client";

  #metafile?: Metafile;
  #build: Build;
  #entriesBuilder: EntriesBuilder;
  #clientComponentOutputMap = new Map<string, ClientComponentOutput>();
  #imagesMap = new Map<string, Image>();

  constructor({
    build,
    entriesBuilder,
  }: {
    build: Build;
    entriesBuilder: EntriesBuilder;
  }) {
    super();
    this.#build = build;
    this.#entriesBuilder = entriesBuilder;
  }

  get clientEntryPoints() {
    let files = Array.from(this.#entriesBuilder.clientComponentEntryMap.keys());

    // entry point order matters for deterministic builds
    return files.sort();
  }

  get entries() {
    return this.#entriesBuilder;
  }

  get #env() {
    return this.#build.name;
  }

  get imagesMap() {
    return this.#imagesMap;
  }

  async setup() {}

  async build() {
    this.clearError();
    this.#metafile = undefined;

    let builder = this;
    this.#imagesMap = new Map();

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
        minify: this.#env === "production",
        define: {
          "process.env.NODE_ENV": `"${this.#env}"`,
        },
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          {
            name: "prod-error-html",
            async setup(build) {
              if (builder.#env === "production") {
                build.initialOptions.define = build.initialOptions.define ?? {};

                let errorHtml = await readFile(
                  new URL("./server-files/error.html", appCompiledDir),
                  "utf-8"
                );

                let encodedHtml = JSON.stringify(errorHtml);
                build.initialOptions.define[
                  "process.env.TWOFOLD_PROD_ERROR_HTML"
                ] = `${encodedHtml}`;
              }
            },
          },
          {
            name: "add-webpack-loaders-to-rsdw-client",
            async setup(build) {
              let loadersUrl = new URL(
                "./client/apps/client/ext/webpack-loaders.ts",
                frameworkSrcDir
              );
              let loadersPath = fileURLToPath(loadersUrl);
              let loadersContents = await readFile(loadersPath, "utf-8");

              let result = await transform(loadersContents, {
                loader: "ts",
                format: "cjs",
              });
              let header = result.code;

              build.onLoad(
                { filter: /react-server-dom-webpack(\/|\\)client/ },
                async ({ path }) => {
                  let rsdwClientContents = await readFile(path, "utf-8");
                  let newContents = `${header}\n\n${rsdwClientContents}`;

                  return {
                    contents: newContents,
                    loader: "js",
                  };
                }
              );
            },
          },
          serverActionClientReferencePlugin({ builder: builder }),
          clientComponentMapPlugin({
            clientEntryPoints: this.clientEntryPoints,
            onEnd: (clientComponentOutputMap) => {
              this.#clientComponentOutputMap = clientComponentOutputMap;
            },
          }),
          imagesPlugin({
            builder,
            prefixPath: "/__tf/assets/images",
          }),
          {
            name: "react-babel-transforms",
            async setup(build) {
              let appConfig = await builder.#build.getAppConfig();
              let refreshEnabled =
                builder.#env === "development" &&
                process.env.NODE_ENV !== "production";
              let compilerEnabled = appConfig.reactCompiler;

              if (!refreshEnabled) {
                let frameworkSrcPath = fileURLToPath(frameworkSrcDir);

                build.onLoad(
                  { filter: /ext(\/|\\)react-refresh/ },
                  async (args) => {
                    if (args.path.startsWith(frameworkSrcPath)) {
                      return {
                        contents: "",
                        loader: "empty",
                      };
                    }
                  }
                );
              }

              let shouldRunBabel = refreshEnabled || compilerEnabled;

              if (shouldRunBabel) {
                let appAppPath = fileURLToPath(appAppDir);
                let escapedPrefix = escapeRegExp(appAppPath);
                let appPathRegex = new RegExp(
                  `^${escapedPrefix}.*\\.(ts|tsx)$`
                );

                build.onLoad({ filter: appPathRegex }, async ({ path }) => {
                  let contents = await readFile(path, "utf-8");

                  // esbuild transform ts to js
                  let { code } = await transform(contents, {
                    loader: "tsx",
                    jsx: "automatic",
                    format: "esm",
                  });

                  let plugins = [];

                  if (compilerEnabled) {
                    plugins.push([
                      "babel-plugin-react-compiler",
                      { sources: null },
                    ]);
                  }

                  if (refreshEnabled) {
                    plugins.push("react-refresh/babel");
                  }

                  // babel transform
                  let result = await transformAsync(code, {
                    plugins,
                    configFile: false,
                    babelrc: false,
                  });

                  let newContents = result?.code;

                  // add refresh
                  if (
                    refreshEnabled &&
                    newContents &&
                    /\$RefreshReg\$\(/.test(newContents)
                  ) {
                    let moduleName = path
                      .slice(appAppPath.length)
                      .replace(/\.tsx$/, "");

                    let start = `
                        let prevRefreshReg = undefined;
                        let prevRefreshSig = undefined;
                        if (typeof window !== 'undefined') {
                          prevRefreshReg = window.$RefreshReg$;
                          prevRefreshSig = window.$RefreshSig$;
                          window.$RefreshReg$ = (type, refreshId) => {
                            let registerId = \`${encodeURIComponent(
                              moduleName
                            )} \${refreshId}\`;
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
                    newContents = `${start}\n${newContents}\n${end}`;
                  }

                  if (newContents) {
                    return {
                      contents: newContents,
                      loader: "js",
                      resolveDir: dirname(path),
                    };
                  }
                });
              }
            },
          },
        ],
      });

      this.#metafile = results?.metafile;
    } catch (error) {
      console.error(error);
      this.reportError(error);
    }
  }

  async stop() {}

  serialize() {
    return {
      metafile: this.#metafile,
      clientComponentOutputMap: Object.fromEntries(
        this.#clientComponentOutputMap.entries()
      ),
      imagesMap: Object.fromEntries(this.#imagesMap.entries()),
    };
  }

  load(data: any) {
    this.#metafile = data.metafile;
    this.#clientComponentOutputMap = new Map(
      Object.entries(data.clientComponentOutputMap)
    );
    this.#imagesMap = new Map(Object.entries(data.imagesMap));
  }

  private get initializeBrowserPath() {
    let initializeBrowser = fileURLToPath(
      new URL(
        "./client/apps/client/browser/initialize-browser.tsx",
        frameworkSrcDir
      )
    );

    return initializeBrowser;
  }

  private get srcSSRAppPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./client/apps/client/ssr/ssr-app.tsx", frameworkSrcDir)
    );

    return initializeBrowser;
  }

  private get metafile() {
    if (!this.#metafile) {
      throw new Error("Failed to get metafile");
    }

    return this.#metafile;
  }

  get bootstrapPath() {
    return getCompiledEntrypoint(this.initializeBrowserPath, this.metafile);
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
      this.#entriesBuilder.clientComponentEntryMap.values()
    );
    let clientComponentModuleMap = new Map<
      string,
      {
        path: string;
      }
    >();

    for (let clientComponentInput of clientComponents) {
      let { moduleId, path } = clientComponentInput;
      let clientComponentOutput = outputMap.get(path);

      if (clientComponentOutput) {
        clientComponentModuleMap.set(moduleId, {
          path: clientComponentOutput.outputPath,
        });
      }
    }

    return Object.fromEntries(clientComponentModuleMap.entries());
  }

  get clientComponentMap() {
    let outputMap = this.#clientComponentOutputMap;
    if (!outputMap) {
      return {};
    }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentEntryMap.values()
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
      let chunk1 = `${moduleId}:${output.name}:${output.hash}`;
      let chunk2 = `${output.name}-${output.hash}.js`;

      for (let exportName of output.exports) {
        let id = `${moduleId}#${exportName}`;

        clientComponentMap.set(id, {
          id,
          chunks: [chunk1, chunk2],
          name: exportName,
          async: false,
        });
      }
    }

    return Object.fromEntries(clientComponentMap.entries());
  }

  // see if we can derive this from clientComponentMap
  get ssrManifestModuleMap() {
    let outputMap = this.#clientComponentOutputMap;

    if (!outputMap) {
      return {};
    }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentEntryMap.values()
    );
    let ssrManifestModuleMap = new Map<
      string,
      {
        [exportName: string]: {
          id: string;
          chunks: string[];
          name: string;
        };
      }
    >();

    for (let clientComponent of clientComponents) {
      let { moduleId, path } = clientComponent;

      let output = outputMap.get(path);
      if (!output) {
        throw new Error("Missing output");
      }

      // [moduleId:name:hash]
      let chunk1 = `${moduleId}:${output.name}:${output.hash}`;
      let chunk2 = `${output.name}-${output.hash}.js`;

      for (let exportName of output.exports) {
        let id = `${moduleId}#${exportName}`;

        ssrManifestModuleMap.set(id, {
          [exportName]: {
            id,
            chunks: [chunk1, chunk2],
            name: exportName,
          },
        });
      }
    }

    return Object.fromEntries(ssrManifestModuleMap.entries());
  }

  get chunks() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
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
        file,
        path: path.join(process.cwd(), chunkFile),
      };
    });
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
