import { transform as serverFunctionTransform } from "@twofold/server-function-transforms";
import { transform } from "esbuild";
import { readFile } from "fs/promises";
import * as mime from "mime-types";
import { createRequire } from "module";
import { transform as oxcTransformReact } from "oxc-transform-react";
import path, { dirname, relative, sep } from "path";
import {
  build as rolldownBuild,
  type OutputAsset,
  type OutputChunk,
  type Plugin,
} from "rolldown";
import { fileURLToPath } from "url";
import type { Config } from "../../../types/importable.js";
import { appCompiledDir, frameworkSrcDir } from "../../files.js";
import { fileURLToEscapedPath, hashFile } from "../helpers/file.js";
import { pathToLanguage } from "../helpers/languages.js";
import { getModuleId } from "../helpers/module.js";
import { LazyValue } from "../helpers/lazy-value.js";
import { Builder } from "./builder.js";
import type { EntriesOutput } from "./entries-builder.js";
import type { ServerFilesOutput } from "./server-files-builder.js";

export type ClientBuilderInput = {
  readonly environment: "development" | "production";
  readonly config: Config;
  readonly entries: EntriesOutput;
  readonly serverFiles: ServerFilesOutput;
};

type Entry = {
  readonly moduleId: string;
  readonly path: string;
};

type Image = {
  readonly id: string;
  readonly type: string;
  readonly path: string;
};

type Output = {
  readonly fileName: OutputChunk["fileName"];
  readonly facadeModuleId: OutputChunk["facadeModuleId"];
  readonly exports: readonly string[];
};

type ClientComponentModuleMap = Readonly<
  Record<string, { readonly path: string }>
>;

type ClientComponentMap = Readonly<
  Record<
    string,
    {
      readonly id: string;
      readonly chunks: readonly string[];
      readonly name: string;
      readonly async: false;
    }
  >
>;

type SSRManifestModuleMap = Readonly<
  Record<
    string,
    Readonly<
      Record<
        string,
        {
          readonly id: string;
          readonly chunks: readonly string[];
          readonly name: string;
        }
      >
    >
  >
>;

type Chunk = {
  readonly hash: string;
  readonly file: string;
  readonly path: string;
};

export class ClientBuilder extends Builder<ClientBuilderInput, ClientOutput> {
  async build({
    environment,
    config,
    entries,
    serverFiles,
  }: ClientBuilderInput) {
    let sourceRoot = entries.sourceRoot;
    let rootPath = fileURLToPath(sourceRoot);
    let appAppDir = new URL("./app/", sourceRoot);
    let appAppPath = fileURLToPath(appAppDir);
    let imagesMap = new Map<string, Image>();

    let callServerPath = fileURLToPath(
      new URL("./client/apps/client/actions/call-server.ts", frameworkSrcDir),
    );
    let loadersPath = fileURLToPath(
      new URL("./client/apps/client/ext/webpack-loaders.ts", frameworkSrcDir),
    );
    let loadersContents = await readFile(loadersPath, "utf-8");
    let rsdwPatch = await transform(loadersContents, {
      loader: "ts",
      format: "cjs",
    });
    let rsdwHeader = rsdwPatch.code;
    let appRequire = createRequire(
      fileURLToPath(new URL("./package.json", sourceRoot)),
    );
    let rsdwPackageJsonPath = appRequire.resolve(
      "react-server-dom-webpack/package.json",
    );
    let rsdwPackageDir = dirname(rsdwPackageJsonPath);
    let rsdwClientBrowserPath = path.join(rsdwPackageDir, "client.browser.js");
    let rsdwClientEdgePath = path.join(rsdwPackageDir, "client.edge.js");
    let refreshEnabled =
      environment === "development" && process.env.NODE_ENV !== "production";
    let compilerEnabled = config.reactCompiler ?? false;
    let initializeBrowserPath = sourceInitializeBrowserPath();
    let srcSSRAppPath = sourceSSRAppPath();

    // entry point order affects output hashes, so keep client builds deterministic.
    let clientEntryPoints = Array.from(
      entries.clientComponentEntryMap.keys(),
    ).sort();

    let result = await rolldownBuild({
      cwd: rootPath,
      input: [initializeBrowserPath, srcSSRAppPath, ...clientEntryPoints],
      resolve: {
        alias: {
          "react-server-dom-webpack/client": rsdwClientBrowserPath,
          "react-server-dom-webpack/client.edge": rsdwClientEdgePath,
          "react-server-dom-webpack/client.browser": rsdwClientBrowserPath,
        },
      },
      transform: {
        define: {
          "process.env.NODE_ENV": `"${environment}"`,
        },
      },
      onLog(_level, log) {
        // Unresolved imports otherwise become globals and fail later at runtime.
        if (log.code === "UNRESOLVED_IMPORT") {
          throw new Error(
            `Could not resolve import "${log.exporter}" in ${log.id}`,
          );
        }
      },
      treeshake: true,
      preserveEntrySignatures: "allow-extension",
      plugins: [
        createErrorHtmlPlugin({
          errorHtmlPath: serverFiles.errorHtmlPath,
        }),
        {
          name: "server-actions",
          transform: {
            filter: {
              id: /^(?!.*react-server-dom-webpack[\\/].*[\\/]react-server-dom-webpack-client\.(edge|browser)\..*\.js$).*\.(js|ts|jsx|tsx|mjs)$/,
              code: /["']use server["']/,
              moduleType: ["ts", "tsx", "js", "jsx"],
            },
            async handler(code, id) {
              let moduleId = getModuleId(id);
              let language = pathToLanguage(id);
              let dir = dirname(id);
              let relativeCallServerPath = relative(dir, callServerPath);
              let callServerImportPath = relativeCallServerPath
                .split(sep)
                .join("/")
                .replace(/\.ts$/, "");
              let transformed = await serverFunctionTransform({
                input: { code, language },
                moduleId,
                client: {
                  callServerModule: callServerImportPath,
                },
              });

              return transformed.serverFunctions.length > 0
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
              return {
                code: `${rsdwHeader}\n\n${code}`,
                moduleType: "js",
              };
            },
          },
        },
        createImagesPlugin({
          prefixPath: "/__tf/assets/images",
          onImage: (image) => imagesMap.set(image.id, image),
        }),
        {
          name: "react-refresh-ext-loader",
          load: {
            filter: {
              id: fileURLToPath(
                new URL(
                  "./client/apps/client/ext/react-refresh.ts",
                  frameworkSrcDir,
                ),
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
        createReactOxcPlugin({
          appAppDir,
          refreshEnabled,
          compilerEnabled,
        }),
      ],
      output: {
        dir: fileURLToPath(new URL("./client/", appCompiledDir)),
        hashCharacters: "base36",
        entryFileNames: "entries/[name]-[hash].js",
        chunkFileNames: "chunks/chunk-[hash].js",
        minify: environment === "production",
        format: "esm",
        cleanDir: true,
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-refresh|react-server-dom-webpack)[\\/](?!.*(server|edge))/,
              priority: 999,
            },
            {
              name: "call-server",
              test: `^${fileURLToEscapedPath(
                new URL(
                  "./client/apps/client/actions/call-server",
                  frameworkSrcDir,
                ),
              )}`,
              priority: 998,
            },
            {
              name: "contexts",
              test: new RegExp(
                `^${fileURLToEscapedPath(
                  new URL("./client/apps/client/contexts/", frameworkSrcDir),
                )}`,
              ),
              priority: 997,
            },
            {
              name: "client-browser-app",
              test: new RegExp(
                `^${fileURLToEscapedPath(
                  new URL("./client/apps/client/browser/", frameworkSrcDir),
                )}`,
              ),
              priority: 990,
            },
            {
              name: "client-ssr-app",
              test: new RegExp(
                `^${fileURLToEscapedPath(
                  new URL("./client/apps/client/ssr/", frameworkSrcDir),
                )}`,
              ),
              priority: 980,
            },
            {
              name: "twofold-client-pieces",
              test: new RegExp(
                `^${fileURLToEscapedPath(new URL("./client/", frameworkSrcDir))}(components|hooks|actions|contexts)[\\/]`,
              ),
              priority: 970,
              minShareCount: 2,
            },
            {
              name: "twofold-error-pieces",
              test: new RegExp(
                `^${fileURLToEscapedPath(new URL("./client/components/", frameworkSrcDir))}(boundaries|error-templates)[\\/]`,
              ),
              priority: 960,
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
              priority: 950,
              minSize: 15 * 1024,
              minShareCount: 2,
            },
            {
              name: "vendor-small",
              test: /[\\/]node_modules[\\/]/,
              priority: 940,
              minSize: 0,
              maxSize: 220 * 1024,
              minShareCount: 2,
            },
            {
              name: (id) => {
                let dir = dirname(id);
                let relativeDirPath = dir.substring(appAppPath.length);
                let extension = path.extname(id);
                let relativeFilePath = id
                  .substring(appAppPath.length)
                  .slice(0, -extension.length);

                return relativeDirPath.match(/[\\/]/)
                  ? relativeDirPath
                  : relativeFilePath;
              },
              test: new RegExp(`^${fileURLToEscapedPath(appAppDir)}`),
              priority: 890,
              minSize: 0,
              minShareCount: 2,
            },
            {
              name: (id) => {
                let dir = dirname(id);
                return dir.substring(appAppPath.length);
              },
              test: new RegExp(
                `^${fileURLToEscapedPath(new URL("./pages/", appAppDir))}`,
              ),
              priority: 880,
              minSize: 0,
            },
          ],
        },
      },
    });

    return new ClientOutput({
      outputs: trimRolldownOutput(result.output),
      clientComponentEntryMap: entries.clientComponentEntryMap,
      imagesMap,
    });
  }

  load(data: ReturnType<ClientOutput["serialize"]>) {
    return new ClientOutput({
      outputs: data.outputs,
      clientComponentEntryMap: new Map(
        Object.entries(data.clientComponentEntryMap),
      ),
      imagesMap: new Map(Object.entries(data.imagesMap)),
    });
  }
}

export class ClientOutput {
  readonly #outputs: readonly Output[];
  readonly #clientComponentEntryMap: ReadonlyMap<string, Entry>;

  readonly imagesMap: ReadonlyMap<string, Image>;

  constructor({
    outputs,
    clientComponentEntryMap,
    imagesMap,
  }: {
    outputs: readonly Output[];
    clientComponentEntryMap: ReadonlyMap<string, Entry>;
    imagesMap: ReadonlyMap<string, Image>;
  }) {
    this.#outputs = outputs;
    this.#clientComponentEntryMap = clientComponentEntryMap;
    this.imagesMap = imagesMap;
  }

  readonly #bootstrapPath = new LazyValue(() =>
    getCompiledEntrypoint(this.#outputs, sourceInitializeBrowserPath()),
  );

  readonly #SSRAppPath = new LazyValue(() =>
    getCompiledEntrypoint(this.#outputs, sourceSSRAppPath()),
  );

  readonly #clientComponentModuleMap = new LazyValue<ClientComponentModuleMap>(
    () =>
      Object.fromEntries(
        Array.from(this.#clientComponentEntryMap.values(), (entry) => [
          entry.moduleId,
          {
            path: getCompiledEntrypoint(this.#outputs, entry.path),
          },
        ]),
      ),
  );

  readonly #clientComponentMap = new LazyValue<ClientComponentMap>(() => {
    let clientComponentMap = new Map<
      string,
      {
        readonly id: string;
        readonly chunks: readonly string[];
        readonly name: string;
        readonly async: false;
      }
    >();

    for (let clientComponent of this.#clientComponentEntryMap.values()) {
      let { moduleId } = clientComponent;
      let chunk = getOutput(this.#outputs, clientComponent.path);
      let fileName = chunk.fileName;
      let name = getNameFromChunkFileName(fileName);
      let hash = getHashFromChunkFileName(fileName);
      let chunk1 = `${moduleId}:${name}:${hash}`;
      let chunk2 = fileName;

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
  });

  readonly #ssrManifestModuleMap = new LazyValue<SSRManifestModuleMap>(() =>
    Object.fromEntries(
      Object.entries(this.clientComponentMap).map(([id, clientComponent]) => [
        id,
        {
          [clientComponent.name]: {
            id,
            chunks: clientComponent.chunks,
            name: clientComponent.name,
          },
        },
      ]),
    ),
  );

  readonly #chunks = new LazyValue<readonly Chunk[]>(() => {
    let appCompiledPath = fileURLToPath(appCompiledDir);

    return this.#outputs
      .filter((output) =>
        /chunks\/chunk-[a-zA-Z0-9]+\.js$/.test(output.fileName),
      )
      .map((chunk) => {
        let file = path.basename(chunk.fileName);
        let nameWithoutExtension = file.split(".")[0] ?? file;
        let parts = nameWithoutExtension.split("-");
        let hash = parts.at(-1) ?? "";
        return {
          hash,
          file,
          path: path.join(appCompiledPath, "client", chunk.fileName),
        };
      });
  });

  get bootstrapPath() {
    return this.#bootstrapPath.value;
  }

  get SSRAppPath() {
    return this.#SSRAppPath.value;
  }

  get clientComponentModuleMap() {
    return this.#clientComponentModuleMap.value;
  }

  get clientComponentMap() {
    return this.#clientComponentMap.value;
  }

  get ssrManifestModuleMap() {
    return this.#ssrManifestModuleMap.value;
  }

  get chunks() {
    return this.#chunks.value;
  }

  serialize() {
    return {
      outputs: this.#outputs,
      clientComponentEntryMap: Object.fromEntries(
        this.#clientComponentEntryMap.entries(),
      ),
      imagesMap: Object.fromEntries(this.imagesMap.entries()),
    };
  }

  warm() {
    void this.#bootstrapPath.value;
    void this.#SSRAppPath.value;
    void this.#clientComponentModuleMap.value;
    void this.#clientComponentMap.value;
    void this.#ssrManifestModuleMap.value;
    void this.#chunks.value;
  }
}

function trimRolldownOutput(
  outputs: readonly (OutputChunk | OutputAsset)[],
): Output[] {
  return outputs
    .filter((output) => output.type === "chunk")
    .map((output) => ({
      fileName: output.fileName,
      facadeModuleId: output.facadeModuleId,
      exports: output.exports,
    }));
}

function getOutput(outputs: readonly Output[], id: string): Output {
  let output = outputs.find((candidate) => candidate.facadeModuleId === id);
  if (!output) {
    throw new Error(`Failed to get chunk from id: ${id}`);
  }
  return output;
}

function getNameFromChunkFileName(fileName: string) {
  return fileName.split("-").slice(0, -1).join("-");
}

function getHashFromChunkFileName(fileName: string) {
  let file = fileName.split("/").at(-1);
  let hash = file?.split("-").at(-1)?.split(".")[0];
  if (!hash) {
    throw new Error(`Failed to get hash for ${fileName}`);
  }
  return hash;
}

function getCompiledEntrypoint(outputs: readonly Output[], id: string) {
  let chunk = getOutput(outputs, id);
  return fileURLToPath(new URL(`./client/${chunk.fileName}`, appCompiledDir));
}

function sourceInitializeBrowserPath() {
  return fileURLToPath(
    new URL(
      "./client/apps/client/browser/initialize-browser.tsx",
      frameworkSrcDir,
    ),
  );
}

function sourceSSRAppPath() {
  return fileURLToPath(
    new URL("./client/apps/client/ssr/ssr-app.tsx", frameworkSrcDir),
  );
}

function createErrorHtmlPlugin({
  errorHtmlPath,
}: {
  errorHtmlPath: string;
}): Plugin {
  let moduleId = "twofold:error-html";
  let resolvedModuleId = `\0${moduleId}`;

  return {
    name: "error-html",
    resolveId(source) {
      return source === moduleId ? resolvedModuleId : null;
    },
    async load(id) {
      if (id !== resolvedModuleId) {
        return null;
      }

      let errorHtml = await readFile(errorHtmlPath, "utf-8");

      return {
        code: `export default ${JSON.stringify(errorHtml)};`,
        moduleType: "js",
      };
    },
  };
}

function createImagesPlugin({
  prefixPath,
  onImage,
}: {
  prefixPath: string;
  onImage: (image: Image) => void;
}): Plugin {
  return {
    name: "images",
    load: {
      filter: {
        id: /\.(jpe?g|png|gif|webp|avif|svg)$/i,
      },
      async handler(id) {
        let ext = path.extname(id);
        let name = path.basename(id, ext);
        let hash = await hashFile(id);
        let imageId = `${name}-${hash}${ext}`;
        let type = mime.contentType(ext) || "";
        let publicUrl = `${prefixPath}/${imageId}`;

        onImage({ id: imageId, type, path: id });

        return {
          code: `export default ${JSON.stringify(publicUrl)};`,
          moduleType: "js",
        };
      },
    },
  };
}

function createReactOxcPlugin({
  appAppDir,
  refreshEnabled,
  compilerEnabled,
}: {
  appAppDir: URL;
  refreshEnabled: boolean;
  compilerEnabled: boolean;
}): Plugin {
  let shouldRunOxc = refreshEnabled || compilerEnabled;
  let appAppPath = fileURLToPath(appAppDir);

  return {
    name: "react-oxc-transforms",
    ...(shouldRunOxc
      ? {
          transform: {
            filter: {
              id: new RegExp(
                `^${fileURLToEscapedPath(appAppDir)}.*\\.(js|ts|jsx|tsx)$`,
              ),
              code: [
                /<\s*\/?\s*(?!>)(?:[A-Z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)?|[a-z][a-z0-9]*)(?:\s+[^<>]*?)?\s*\/?>/,
                /<\/?>/,
                /(?:useState|useEffect|useEffectEvent|useRef|useReducer|useContext|useLayoutEffect|useId|useTransition|useDeferredValue|useSyncExternalStore|use[A-Z][A-Za-z0-9_]*)\s*\(/,
                /import\s+[^;]*from\s+['"]react['"]/,
              ],
            },
            async handler(code, id) {
              let compiled = await oxcTransformReact(id, code, {
                reactCompiler: compilerEnabled,
                jsx: {
                  refresh: refreshEnabled,
                },
              });

              if (compiled.fatal) {
                let diagnostic = compiled.errors[0];
                throw new Error(
                  diagnostic
                    ? [diagnostic.message, diagnostic.codeframe]
                        .filter(Boolean)
                        .join("\n")
                    : `Failed to transform ${id}`,
                  { cause: diagnostic },
                );
              }

              let newCode = compiled.code;
              if (
                refreshEnabled &&
                newCode &&
                /\$RefreshReg\$\(/.test(newCode)
              ) {
                let moduleName = id
                  .slice(appAppPath.length)
                  .replace(/\.(tsx|ts|jsx|js)$/, "");
                let start = `
                  let prevRefreshReg = undefined;
                  let prevRefreshSig = undefined;
                  if (typeof window !== 'undefined') {
                    prevRefreshReg = window.$RefreshReg$;
                    prevRefreshSig = window.$RefreshSig$;
                    window.$RefreshReg$ = (type, refreshId) => {
                      let registerId = \`${encodeURIComponent(moduleName)} \${refreshId}\`;
                      window.$RefreshRuntime$.register(type, registerId);
                    };
                    window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
                  }`;
                let end = `
                  if (typeof window !== 'undefined') {
                    window.$RefreshReg$ = prevRefreshReg;
                    window.$RefreshSig$ = prevRefreshSig;
                  }`;
                newCode = `${start}\n${newCode}\n${end}`;
              }

              if (newCode) {
                return {
                  code: newCode,
                  moduleType: "js",
                };
              }
            },
          },
        }
      : {}),
  };
}
