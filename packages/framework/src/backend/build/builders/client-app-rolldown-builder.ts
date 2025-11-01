import { fileURLToPath } from "url";
import { appAppDir, appCompiledDir, frameworkSrcDir } from "../../files.js";
import { Build } from "../build/build.js";
import { Builder } from "./builder.js";
import { EntriesBuilder } from "./entries-builder.js";
import { build, OutputAsset, OutputChunk, Plugin } from "rolldown";
import path, { dirname, relative, sep } from "path";
import { writeFile, readFile } from "fs/promises";
import { transform as serverFunctionTransform } from "@twofold/server-function-transforms";
import { pathToLanguage } from "../helpers/languages.js";
import { getModuleId } from "../helpers/module.js";
import * as mime from "mime-types";
import { fileURLToEscapedPath, hashFile } from "../helpers/file.js";
import { transform } from "esbuild";
import { transformAsync } from "@babel/core";

// TODO: excluded files?

// TODO: [\\/] in path ids? i think so need to test windows

type Output = OutputAsset | OutputChunk;

export class ClientAppRolldownBuilder extends Builder {
  readonly name = "client-rolldown";

  #build: Build;
  #entriesBuilder: EntriesBuilder;
  #outputs?: Output[] | undefined;

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

  get #env() {
    return this.#build.name;
  }

  get imagesMap() {
    return this.#imagesMap;
  }

  async setup() {}

  async build() {
    this.clearError();

    this.#outputs = [];

    // server actions plugin
    let callServerUrl = new URL(
      "./client/apps/client/actions/call-server.ts",
      frameworkSrcDir,
    );
    let callServerPath = fileURLToPath(callServerUrl);

    // images plugin
    this.#imagesMap = new Map();

    // rsdw plugin
    let loadersUrl = new URL(
      "./client/apps/client/ext/webpack-loaders.ts",
      frameworkSrcDir,
    );
    let loadersPath = fileURLToPath(loadersUrl);
    let loadersContents = await readFile(loadersPath, "utf-8");

    let rsdwPatch = await transform(loadersContents, {
      loader: "ts",
      format: "cjs",
    });
    let rsdwHeader = rsdwPatch.code;

    // react babel plugin
    let appConfig = await this.#build.getAppConfig();
    let refreshEnabled =
      this.#env === "development" && process.env.NODE_ENV !== "production";
    let compilerEnabled = appConfig.reactCompiler ?? false;

    const result = await build({
      // platform: "browser",
      input: [
        ...this.clientEntryPoints,
        this.initializeBrowserPath,
        this.srcSSRAppPath,
      ],
      // logLevel: "error",
      treeshake: true,
      plugins: [
        // TODO: PROD ERROR HTML
        {
          name: "server-actions",
          transform: {
            filter: {
              id: /^(?!.*react-server-dom-webpack\/.*\/react-server-dom-webpack-client\.(edge|browser)\..*\.js$).*\.(js|ts|jsx|tsx|mjs)$/,
              code: /["']use server["']/,
              moduleType: ["ts", "tsx", "js", "jsx"],
            },
            async handler(code, id) {
              let moduleId = getModuleId(id);
              let language = pathToLanguage(id);
              let path = id;

              let dir = dirname(path);
              let relativeCallServerPath = relative(dir, callServerPath);
              let callServerImportPath = relativeCallServerPath
                .split(sep)
                .join("/")
                .replace(/\.ts$/, "");

              let transformed = await serverFunctionTransform({
                input: {
                  code,
                  language,
                },
                moduleId,
                client: {
                  callServerModule: callServerImportPath,
                },
              });

              let hasServerFunctions = transformed.serverFunctions.length > 0;
              return hasServerFunctions
                ? {
                    code: transformed.code,
                    moduleType: "js",
                  }
                : null;
            },
          },
        },

        {
          name: "add-webpack-loaders-to-rsdw-client",
          transform: {
            filter: {
              id: /[\\/]node_modules[\\/]react-server-dom-webpack[\\/]client/,
            },
            handler(code) {
              let newCode = `${rsdwHeader}\n\n${code}`;
              return {
                code: newCode,
                moduleType: "js",
              };
            },
          },
        },

        createImagesPlugin({
          prefixPath: "/__tf/assets/images",
          onImage: (image) => this.#imagesMap.set(image.id, image),
        }),

        {
          name: "react-refresh-ext-loader",
          load: {
            filter: {
              id: path.join(
                fileURLToPath(frameworkSrcDir),
                "client",
                "apps",
                "client",
                "ext",
                "react-refresh.ts",
              ),
            },
            handler() {
              return refreshEnabled
                ? null
                : {
                    code: "",
                    moduleType: "js",
                  };
            },
          },
        },

        createReactBabelPlugin({
          refreshEnabled,
          compilerEnabled,
        }),
      ],

      output: {
        dir: "./.twofold/client-app-rolldown/",
        hashCharacters: "base36",
        entryFileNames: "entries/[name]-[hash].js",
        chunkFileNames: "chunks/chunk-[hash].js",
        minify: this.#env === "production",
        format: "esm",
        cleanDir: true,

        advancedChunks: {
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-refresh|react-server-dom-webpack)[\\/](?!.*(server|edge))/,
              priority: 999,
              minShareCount: 2,
            },
            {
              name: (id) => {
                let modulePath = id.split(/[\\/]node_modules[\\/]/).at(-1);
                if (!modulePath) return null;
                let pkg = modulePath.startsWith("@")
                  ? modulePath.split(/[\\/]/).slice(0, 2).join("__")
                  : modulePath.split(/[\\/]/)[0];
                return `vendor-${pkg}`;
              },
              test: /[\\/]node_modules[\\/]/,
              priority: 990,
              minSize: 15 * 1024,
              minShareCount: 2,
              // maxSize: 200 * 1024,
            },
            {
              name: "vendor-small",
              test: /[\\/]node_modules[\\/]/,
              priority: 900,
              minSize: 0,
              maxSize: 220 * 1024,
              minShareCount: 2,
            },
            {
              name: "client-app",
              test: new RegExp(
                `^${fileURLToEscapedPath(
                  new URL("./client/apps/client", frameworkSrcDir),
                )}`,
              ),
              priority: 899,
              minShareCount: 2,
            },
            {
              name: "twofold-client-pieces",
              test: new RegExp(
                `^${fileURLToEscapedPath(new URL("./client/", frameworkSrcDir))}(components|hooks|actions)[\\/]`,
              ),
              priority: 890,
              minShareCount: 2,
            },
          ],
        },
      },
    });

    // TODO: clean output

    this.#outputs = result.output;

    // write result output to disk
    await writeFile(
      "./.twofold/debug-output.json",
      JSON.stringify(result.output, null, 2),
    );
  }

  async stop() {}

  async serialize() {}

  async load() {}

  warm() {}

  private get initializeBrowserPath() {
    let initializeBrowser = fileURLToPath(
      new URL(
        "./client/apps/client/browser/initialize-browser.tsx",
        frameworkSrcDir,
      ),
    );

    return initializeBrowser;
  }

  private get srcSSRAppPath() {
    let initializeBrowser = fileURLToPath(
      new URL("./client/apps/client/ssr/ssr-app.tsx", frameworkSrcDir),
    );

    return initializeBrowser;
  }

  get bootstrapPath() {
    if (!this.#outputs) {
      throw new Error("Outputs missing");
    }

    return getCompiledEntrypoint(this.#outputs, this.initializeBrowserPath);
  }

  get SSRAppPath() {
    if (!this.#outputs) {
      throw new Error("Outputs missing");
    }

    return getCompiledEntrypoint(this.#outputs, this.srcSSRAppPath);
  }

  get clientComponentModuleMap() {
    // moduleId -> {
    //   path: outputFile
    // }

    if (!this.#outputs) {
      return {};
    }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentEntryMap.values(),
    );
    let clientComponentModuleMap = new Map<
      string,
      {
        path: string;
      }
    >();

    for (let clientComponentInput of clientComponents) {
      clientComponentModuleMap.set(clientComponentInput.moduleId, {
        path: getCompiledEntrypoint(this.#outputs, clientComponentInput.path),
      });
    }

    return Object.fromEntries(clientComponentModuleMap.entries());
  }

  get clientComponentMap() {
    // `${moduleId}#${exportName}` -> {
    //    id,
    //    chunks: [chunk1, chunk2]
    //    name: exportName,
    //    async: false
    // }

    if (!this.#outputs) {
      return {};
    }

    // clientComponentMap.set(id, {
    //   id,
    //   chunks: [chunk1, chunk2],
    //   name: exportName,
    //   async: false,
    // });

    // let outputMap = this.#clientComponentOutputMap;
    // if (!outputMap) {
    //   return {};
    // }

    let clientComponents = Array.from(
      this.#entriesBuilder.clientComponentEntryMap.values(),
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
      let { moduleId } = clientComponent;
      let chunk = getChunk(this.#outputs, clientComponent.path);
      let fileName = chunk.fileName;
      let name = getNameFromChunkFileName(fileName);
      let hash = getHashFromChunkFileName(fileName);

      // [moduleId:name:hash]
      let chunk1 = `${moduleId}:${name}:${hash}`;
      let chunk2 = `${fileName}`; // actual chunk

      for (let exportName of chunk.exports) {
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

  get ssrManifestModuleMap() {
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

    for (let [id, clientComponent] of Object.entries(this.clientComponentMap)) {
      ssrManifestModuleMap.set(id, {
        [clientComponent.name]: {
          id,
          chunks: clientComponent.chunks,
          name: clientComponent.name,
        },
      });
    }

    return Object.fromEntries(ssrManifestModuleMap.entries());
  }

  get chunks() {
    let outputs = this.#outputs;

    if (!outputs) {
      return [];
    }

    let chunkFiles = outputs.filter((output) => {
      return /chunks\/chunk-[a-zA-Z0-9]+\.js$/.test(output.fileName);
    });

    let appCompiledPath = fileURLToPath(appCompiledDir);

    return chunkFiles.map((chunk) => {
      let file = path.basename(chunk.fileName);
      let nameWithoutExtension = file.split(".")[0] ?? file;
      let parts = nameWithoutExtension.split("-");
      let hash = parts.at(-1) ?? "";
      return {
        hash,
        file,
        path: path.join(appCompiledPath, "client-app-rolldown", chunk.fileName),
      };
    });
  }
}

function getChunk(outputs: Output[], id: string) {
  let chunk = outputs.find(
    (o) => o.type === "chunk" && o.facadeModuleId === id,
  );

  if (!chunk || chunk.type !== "chunk") {
    throw new Error(`Failed to get chunk from id: ${id}`);
  }

  return chunk;
}

function getNameFromChunkFileName(fileName: string) {
  const dropLast = fileName.split("-").slice(0, -1).join("-");
  return dropLast;
}

function getHashFromChunkFileName(fileName: string) {
  let file = fileName.split("/").at(-1);
  let hash = file?.split("-").at(-1)?.split(".")[0];
  if (!hash) {
    throw new Error(`Failed to get hash for ${fileName}`);
  }
  return hash;
}

function getCompiledEntrypoint(outputs: Output[], id: string) {
  let chunk = getChunk(outputs, id);
  let baseUrl = new URL("./client-app-rolldown/", appCompiledDir);
  let basePath = fileURLToPath(baseUrl);

  return path.join(basePath, chunk.fileName);
}

// images plugin
type Image = {
  id: string;
  type: string;
  path: string;
};

function createImagesPlugin({
  prefixPath,
  onImage,
}: {
  prefixPath: string;
  onImage: (i: Image) => void;
}): Plugin {
  return {
    name: "images",
    load: {
      filter: {
        id: /\.(jpe?g|png|gif|webp|avif|svg)$/i,
      },
      async handler(id) {
        let filePath = id;
        let ext = path.extname(filePath);
        let name = path.basename(filePath, ext);
        let hash = await hashFile(filePath);
        let imageId = `${name}-${hash}${ext}`;
        let type = mime.contentType(ext) || "";
        let publicUrl = `${prefixPath}/${imageId}`;

        onImage({
          id: imageId,
          type,
          path: filePath,
        });

        return {
          code: `export default ${JSON.stringify(publicUrl)};`,
          moduleType: "js",
        };
      },
    },
  };
}

function createReactBabelPlugin({
  refreshEnabled,
  compilerEnabled,
}: {
  refreshEnabled: boolean;
  compilerEnabled: boolean;
}): Plugin {
  let shouldRunBabel = refreshEnabled || compilerEnabled;

  let appAppPath = fileURLToPath(appAppDir);

  let plugins = [];

  if (compilerEnabled) {
    plugins.push(["babel-plugin-react-compiler", { sources: null }]);
  }

  if (refreshEnabled) {
    plugins.push("react-refresh/babel");
  }

  return {
    name: "react-babel-transforms",

    ...(shouldRunBabel
      ? {
          transform: {
            filter: {
              id: new RegExp(
                `^${fileURLToEscapedPath(appAppDir)}.*\\.(js|ts|jsx|tsx)$`,
              ),
              code: [
                // maybe get some tests for this?
                /<\s*\/?\s*(?!>)(?:[A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)?|[a-z][a-z0-9]*)(?:\s+[^<>]*?)?\s*\/?>/,
                /<\/?>/,
                /(?:useState|useEffect|useRef|useReducer|useContext|useLayoutEffect|useId|useTransition|useDeferredValue|useSyncExternalStore|use[A-Z][A-Za-z0-9_]*)\s*\(/,
                /import\s+[^;]*from\s+['"]react['"]/,
              ],
            },
            async handler(code, id) {
              const language = pathToLanguage(id);

              // strip types and add jsx
              let transformed = await transform(code, {
                loader: language,
                format: "esm",
                jsx: "automatic",
              });

              // babel transform
              let result = await transformAsync(transformed.code, {
                plugins,
                configFile: false,
                babelrc: false,
              });

              let newCode = result?.code;

              if (
                refreshEnabled &&
                newCode &&
                /\$RefreshReg\$\(/.test(newCode)
              ) {
                let moduleName = id
                  .slice(appAppPath.length)
                  .replace(/\.(tsx|jsx|js|jsx)$/, "");

                let start = `
            let prevRefreshReg = undefined;
            let prevRefreshSig = undefined;
            if (typeof window !== 'undefined') {
              prevRefreshReg = window.$RefreshReg$;
              prevRefreshSig = window.$RefreshSig$;
              window.$RefreshReg$ = (type, refreshId) => {
                let registerId = \`${encodeURIComponent(
                  moduleName,
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
                newCode = `${start}\n${newCode}\n${end}`;
              }

              if (newCode) {
                return {
                  code: newCode,
                  moduleType:
                    language === "tsx" || language === "jsx" ? "jsx" : "js",
                };
              }
            },
          },
        }
      : {}),
  };
}
