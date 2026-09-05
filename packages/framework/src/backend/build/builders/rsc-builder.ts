import { esbuildPluginTailwind } from "@ryanto/esbuild-plugin-tailwind";
import { transform as clientComponentTransform } from "@twofold/client-component-transforms";
import {
  envKey,
  transform as serverFunctionTransform,
} from "@twofold/server-function-transforms";
import {
  build as esbuildBuild,
  type Metafile,
  type PartialMessage,
  type Plugin,
} from "esbuild";
import { readFile } from "fs/promises";
import * as mime from "mime-types";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  appCompiledDir,
  frameworkCompiledDir,
  frameworkSrcDir,
} from "../../files.js";
import {
  shouldIgnoreUseClient,
  shouldIgnoreUseServer,
} from "../helpers/excluded.js";
import { fileExists, fileURLToEscapedPath, hashFile } from "../helpers/file.js";
import { pathToLanguage } from "../helpers/languages.js";
import { getModuleId } from "../helpers/module.js";
import { API } from "../rsc/api.js";
import { CatchBoundary } from "../rsc/catch-boundary.js";
import { ErrorTemplate } from "../rsc/error-template.js";
import { Generic } from "../rsc/generic.js";
import { Layout } from "../rsc/layout.js";
import { Page } from "../rsc/page.js";
import { Wrapper } from "../rsc/wrapper.js";
import { LazyValue } from "../helpers/lazy-value.js";
import { Builder } from "./builder.js";
import type { EntriesOutput } from "./entries-builder.js";

export type CompiledAction = {
  readonly id: string;
  readonly moduleId: string;
  readonly path: string;
  readonly hash: string;
  readonly export: string;
};

type Image = {
  readonly id: string;
  readonly type: string;
  readonly path: string;
};

type Font = {
  readonly id: string;
  readonly type: string;
  readonly path: string;
};

type ServerAction = {
  readonly id: string;
  readonly path: string;
  readonly moduleId: string;
  readonly export: string;
};

export type RSCBuilderInput = {
  readonly environment: "development" | "production";
  readonly entries: EntriesOutput;
};

type SourcePaths = ReturnType<typeof sourcePathsForRoot>;

type ServerManifest = Readonly<
  Record<
    string,
    {
      readonly id: string;
      readonly name: string;
      readonly chunks: readonly string[];
    }
  >
>;

export class RSCBuilder extends Builder<RSCBuilderInput, RSCOutput> {
  async build({ environment, entries }: RSCBuilderInput) {
    let sourceRoot = entries.sourceRoot;
    let rootPath = fileURLToPath(sourceRoot);
    let srcPaths = sourcePathsForRoot(sourceRoot);
    let hasMiddleware = await fileExists(srcPaths.app.globalMiddleware);
    let middlewareEntry = hasMiddleware ? [srcPaths.app.globalMiddleware] : [];
    let notFoundTemplateEntry = (await fileExists(srcPaths.app.notFound))
      ? srcPaths.app.notFound
      : srcPaths.framework.errorTemplates.notFound;
    let unauthorizedTemplateEntry = (await fileExists(
      srcPaths.app.unauthorized,
    ))
      ? srcPaths.app.unauthorized
      : srcPaths.framework.errorTemplates.unauthorized;

    // Entry order affects output hashes, so keep server action builds deterministic.
    let serverActionEntries = Array.from(
      entries.serverActionEntryMap.keys(),
    ).sort();
    let serverActionMap = new Map<string, CompiledAction>();
    let imagesMap = new Map<string, Image>();
    let fontsMap = new Map<string, Font>();

    let result = await esbuildBuild({
      absWorkingDir: rootPath,
      bundle: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints: [
        "./app/pages/**/*.error.tsx",
        "./app/pages/**/*.page.tsx",
        "./app/pages/**/layout.tsx",
        "./app/pages/**/*.api.ts",
        "./app/pages/**/*.api.tsx",
        ...middlewareEntry,
        ...serverActionEntries,
        notFoundTemplateEntry,
        unauthorizedTemplateEntry,
        srcPaths.framework.pages.unauthorized,
        srcPaths.framework.pages.notFound,
        srcPaths.framework.outerRootWrapper,
        srcPaths.framework.routeStackPlaceholder,
        srcPaths.framework.catchBoundary,
      ],
      outdir: fileURLToPath(rscCompiledDir),
      outbase: "app",
      entryNames: "[ext]/[name]-[hash]",
      external: [...entries.externalPackages],
      conditions: ["react-server", "module"],
      platform: "node",
      splitting: true,
      chunkNames: "chunks/[name]-[hash]",
      metafile: true,
      plugins: [
        clientComponentProxyPlugin(),
        serverActionsPlugin({ sourceRoot, serverActionMap }),
        esbuildPluginTailwind({
          base: fileURLToPath(new URL("./app/", sourceRoot)),
          minify: environment === "production",
        }),
        imagesPlugin({
          imagesMap,
          prefixPath: "/__tf/assets/images",
        }),
        fontsPlugin({
          root: sourceRoot,
          fontsMap,
          prefixPath: "/__tf/assets/fonts",
        }),
        storesPlugin(),
        errorTemplatesPlugin({
          root: sourceRoot,
          entries,
          pagesDir: new URL("./app/pages", sourceRoot),
        }),
      ],
    });

    if (!result.metafile) {
      throw new Error("Missing metafile");
    }

    return new RSCOutput({
      sourceRoot,
      metafile: result.metafile,
      serverActionMap,
      imagesMap,
      fontsMap,
    });
  }

  load(data: ReturnType<RSCOutput["serialize"]>) {
    return new RSCOutput({
      sourceRoot: new URL(data.sourceRoot),
      metafile: data.metafile,
      serverActionMap: new Map(Object.entries(data.serverActionMap)),
      imagesMap: new Map(Object.entries(data.imagesMap)),
      fontsMap: new Map(Object.entries(data.fontsMap)),
    });
  }
}

export class RSCOutput {
  readonly files: readonly string[];
  readonly serverActionMap: ReadonlyMap<string, CompiledAction>;
  readonly imagesMap: ReadonlyMap<string, Image>;
  readonly fontsMap: ReadonlyMap<string, Font>;

  readonly #sourceRoot: URL;
  readonly #metafile: Metafile;
  readonly #srcPaths: SourcePaths;

  constructor({
    sourceRoot,
    metafile,
    serverActionMap,
    imagesMap,
    fontsMap,
  }: {
    sourceRoot: URL;
    metafile: Metafile;
    serverActionMap: ReadonlyMap<string, CompiledAction>;
    imagesMap: ReadonlyMap<string, Image>;
    fontsMap: ReadonlyMap<string, Font>;
  }) {
    this.#sourceRoot = sourceRoot;
    this.#metafile = metafile;
    this.#srcPaths = sourcePathsForRoot(sourceRoot);
    this.files = Object.keys(this.#metafile.outputs);
    this.serverActionMap = serverActionMap;
    this.imagesMap = imagesMap;
    this.fontsMap = fontsMap;
  }

  readonly #routeStackPlaceholder = new LazyValue(
    () =>
      new Generic({
        fileUrl: pathToFileURL(this.routeStackPlaceholderPath),
      }),
  );

  readonly #pages = new LazyValue(() => this.#metafileToPages());
  readonly #layouts = new LazyValue(() => this.#metafileToLayouts());
  readonly #errorTemplates = new LazyValue(() =>
    this.#metafileToErrorTemplates(),
  );
  readonly #catchBoundaries = new LazyValue(() =>
    this.#createCatchBoundaries(),
  );

  readonly #notFoundPage = new LazyValue(
    () =>
      new Page({
        path: "/__tf/errors/not-found",
        fileUrl: pathToFileURL(
          this.#compiledPathForEntry(this.#srcPaths.framework.pages.notFound),
        ),
      }),
  );

  readonly #unauthorizedPage = new LazyValue(
    () =>
      new Page({
        path: "/__tf/errors/unauthorized",
        fileUrl: pathToFileURL(
          this.#compiledPathForEntry(
            this.#srcPaths.framework.pages.unauthorized,
          ),
        ),
      }),
  );

  readonly #outerRootWrapper = new LazyValue(
    () =>
      new Wrapper({
        path: "/",
        fileUrl: pathToFileURL(
          this.#compiledPathForEntry(this.#srcPaths.framework.outerRootWrapper),
        ),
      }),
  );

  readonly #routeRoot = new LazyValue(() => this.#buildRouteRoot());

  readonly #apiEndpoints = new LazyValue(() => this.#metafileToApiEndpoints());

  readonly #css = new LazyValue(() =>
    [
      ...this.#layouts.value.map((layout) => layout.css),
      ...this.#pages.value.map((page) => page.css),
    ].filter((file) => file !== undefined),
  );

  readonly #middlewarePath = new LazyValue(() =>
    this.#compiledPathForEntry(this.#srcPaths.app.globalMiddleware),
  );

  readonly #serverManifest = new LazyValue<ServerManifest>(() =>
    Object.fromEntries(
      Array.from(this.serverActionMap.values(), (action) => [
        action.id,
        {
          id: action.id,
          name: action.export,
          chunks: [`${action.moduleId}:${action.export}:${action.hash}`],
        },
      ]),
    ),
  );

  readonly #serverActionModuleMap: LazyValue<
    Readonly<Record<string, { readonly path: string } | undefined>>
  > = new LazyValue(() =>
    Object.fromEntries(
      Array.from(this.serverActionMap.values(), (action) => [
        action.moduleId,
        { path: action.path },
      ]),
    ),
  );

  get apiEndpoints() {
    return this.#apiEndpoints.value;
  }

  get css() {
    return this.#css.value;
  }

  hasMiddleware() {
    return this.#hasCompiledEntry(this.#srcPaths.app.globalMiddleware);
  }

  get middlewarePath() {
    return this.#middlewarePath.value;
  }

  get routeStackPlaceholderPath() {
    return this.#compiledPathForEntry(
      this.#srcPaths.framework.routeStackPlaceholder,
    );
  }

  findPageForPath(path: string) {
    return this.#routeRoot.value.tree.findPageForPath(path);
  }

  get serverManifest() {
    return this.#serverManifest.value;
  }

  get serverActionModuleMap() {
    return this.#serverActionModuleMap.value;
  }

  serialize() {
    return {
      sourceRoot: this.#sourceRoot.href,
      metafile: this.#metafile,
      serverActionMap: Object.fromEntries(this.serverActionMap.entries()),
      imagesMap: Object.fromEntries(this.imagesMap.entries()),
      fontsMap: Object.fromEntries(this.fontsMap.entries()),
    };
  }

  async warm() {
    let promises = [
      ...this.#layouts.value.map((layout) => layout.preload()),
      ...this.#pages.value.map((page) => page.preload()),
      ...this.#errorTemplates.value.map((template) => template.preload()),
      ...this.#catchBoundaries.value.map((boundary) => boundary.preload()),
      this.#notFoundPage.value.preload(),
      this.#unauthorizedPage.value.preload(),
      this.#outerRootWrapper.value.preload(),
      ...this.apiEndpoints.map((api) => api.preload()),
      ...Array.from(
        this.serverActionMap.values(),
        (action) => import(pathToFileURL(action.path).href),
      ),
      this.hasMiddleware()
        ? import(pathToFileURL(this.middlewarePath).href)
        : Promise.resolve(),
      import(pathToFileURL(this.routeStackPlaceholderPath).href),
    ];

    await Promise.all(promises);
  }

  #buildRouteRoot() {
    let root = this.#layouts.value.find((layout) => layout.path === "/");

    if (!root) {
      throw new Error("No root layout");
    }

    this.#layouts.value
      .filter((layout) => layout !== root)
      .forEach((layout) => root.addChild(layout));
    this.#catchBoundaries.value.forEach((boundary) => root.addChild(boundary));
    this.#pages.value.forEach((page) => root.addChild(page));
    this.#errorTemplates.value.forEach((template) => root.addChild(template));
    root.addChild(this.#unauthorizedPage.value);
    root.addChild(this.#notFoundPage.value);
    root.addWrapper(this.#outerRootWrapper.value);

    return root;
  }

  #metafileToPages() {
    let outputs = this.#metafile.outputs;
    let prefix = "app/pages/";
    let suffix = ".page.tsx";

    return Object.entries(outputs)
      .filter(
        ([, output]) =>
          output.entryPoint?.startsWith(prefix) &&
          output.entryPoint.endsWith(suffix),
      )
      .map(([outputPath, output]) => {
        let entryPoint = output.entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let routePath = entryPoint
          .slice(prefix.length)
          .slice(0, -suffix.length);
        if (routePath === "index" || routePath.endsWith("/index")) {
          routePath = routePath.slice(0, -6);
        }

        return new Page({
          path: `/${routePath}`,
          css: output.cssBundle
            ? this.#cssFileName(output.cssBundle)
            : undefined,
          fileUrl: pathToFileURL(this.#compiledOutputPath(outputPath)),
        });
      });
  }

  #metafileToLayouts() {
    let outputs = this.#metafile.outputs;
    let prefix = "app/pages/";
    let suffix = "/layout.tsx";

    return Object.entries(outputs)
      .filter(
        ([, output]) =>
          output.entryPoint?.startsWith(prefix) &&
          output.entryPoint.endsWith(suffix),
      )
      .map(([outputPath, output]) => {
        let entryPoint = output.entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let routePath = entryPoint
          .slice(prefix.length)
          .slice(0, -suffix.length);

        return new Layout({
          path: `/${routePath}`,
          css: output.cssBundle
            ? this.#cssFileName(output.cssBundle)
            : undefined,
          fileUrl: pathToFileURL(this.#compiledOutputPath(outputPath)),
          routeStackPlaceholder: this.#routeStackPlaceholder.value,
        });
      });
  }

  #metafileToErrorTemplates() {
    let outputs = this.#metafile.outputs;
    let prefix = "app/pages/";
    let suffix = ".error.tsx";
    let templates = Object.entries(outputs)
      .filter(
        ([, output]) =>
          output.entryPoint?.startsWith(prefix) &&
          output.entryPoint.endsWith(suffix),
      )
      .map(([outputPath, output]) => {
        let entryPoint = output.entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let templatePath = `/${entryPoint
          .slice(prefix.length)
          .slice(0, -suffix.length)}`;

        return new ErrorTemplate({
          tag: templatePath.split("/").at(-1) ?? "unknown",
          path: templatePath,
          fileUrl: pathToFileURL(this.#compiledOutputPath(outputPath)),
        });
      });

    if (!templates.some((t) => t.tag === "unauthorized" && t.path === "/")) {
      templates.push(
        new ErrorTemplate({
          tag: "unauthorized",
          path: "/",
          fileUrl: pathToFileURL(
            this.#compiledPathForEntry(
              this.#srcPaths.framework.errorTemplates.unauthorized,
            ),
          ),
        }),
      );
    }

    if (!templates.some((t) => t.tag === "not-found" && t.path === "/")) {
      templates.push(
        new ErrorTemplate({
          tag: "not-found",
          path: "/",
          fileUrl: pathToFileURL(
            this.#compiledPathForEntry(
              this.#srcPaths.framework.errorTemplates.notFound,
            ),
          ),
        }),
      );
    }

    return templates;
  }

  #createCatchBoundaries() {
    let catchBoundaryUrl = pathToFileURL(
      this.#compiledPathForEntry(this.#srcPaths.framework.catchBoundary),
    );
    let catchBoundaryMap = new Map<string, CatchBoundary>();
    catchBoundaryMap.set(
      "/",
      new CatchBoundary({
        path: "/",
        fileUrl: catchBoundaryUrl,
        routeStackPlaceholder: this.#routeStackPlaceholder.value,
      }),
    );

    for (let errorTemplate of this.#errorTemplates.value) {
      let boundaryPath =
        errorTemplate.path === "/"
          ? "/"
          : "/" +
            errorTemplate.path
              .split("/")
              .filter(Boolean)
              .slice(0, -1)
              .join("/");

      if (!catchBoundaryMap.has(boundaryPath)) {
        catchBoundaryMap.set(
          boundaryPath,
          new CatchBoundary({
            path: boundaryPath,
            fileUrl: catchBoundaryUrl,
            routeStackPlaceholder: this.#routeStackPlaceholder.value,
          }),
        );
      }
    }

    return Array.from(catchBoundaryMap.values());
  }

  #metafileToApiEndpoints() {
    let outputs = this.#metafile.outputs;
    let prefix = "app/pages/";
    let suffix = /\.api\.tsx?$/;

    return Object.entries(outputs)
      .filter(
        ([, output]) =>
          output.entryPoint?.startsWith(prefix) &&
          suffix.test(output.entryPoint),
      )
      .map(([outputPath, output]) => {
        let entryPoint = output.entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let suffixMatch = suffix.exec(entryPoint);
        if (!suffixMatch) {
          throw new Error("No suffix match");
        }

        let routePath = entryPoint
          .slice(prefix.length)
          .slice(0, -suffixMatch[0].length);
        if (routePath === "index" || routePath.endsWith("/index")) {
          routePath = routePath.slice(0, -6);
        }

        return new API({
          path: `/${routePath}`,
          fileUrl: pathToFileURL(this.#compiledOutputPath(outputPath)),
        });
      });
  }

  #cssFileName(outputPath: string) {
    let cssPath = fileURLToPath(new URL("./css/", rscCompiledDir));
    return path.relative(cssPath, this.#compiledOutputPath(outputPath));
  }

  #compiledOutputPath(outputPath: string) {
    return resolveCompiledOutputPath({
      sourceRoot: this.#sourceRoot,
      outputDir: rscCompiledDir,
      outputPath,
    });
  }

  #hasCompiledEntry(entryPath: string) {
    let rootPath = fileURLToPath(this.#sourceRoot);
    return Object.values(this.#metafile.outputs).some((output) =>
      output.entryPoint
        ? path.resolve(rootPath, output.entryPoint) === entryPath
        : false,
    );
  }

  #compiledPathForEntry(entryPath: string) {
    let rootPath = fileURLToPath(this.#sourceRoot);
    let outputPath = Object.entries(this.#metafile.outputs).find(
      ([, output]) =>
        output.entryPoint &&
        path.resolve(rootPath, output.entryPoint) === entryPath,
    )?.[0];

    if (!outputPath) {
      throw new Error(`Failed to get compiled entry point: ${entryPath}`);
    }

    return this.#compiledOutputPath(outputPath);
  }
}

function clientComponentProxyPlugin(): Plugin {
  return {
    name: "client-component-proxy-plugin",
    setup(build) {
      build.initialOptions.metafile = true;

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseClient(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");

        if (contents.includes("use client")) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);
          let transformed = await clientComponentTransform({
            input: {
              code: contents,
              language,
            },
            moduleId,
            rscClientPath: "react-server-dom-webpack/server.edge",
          });

          return {
            contents: transformed.code,
            loader: "js",
          };
        }
      });
    },
  };
}

function serverActionsPlugin({
  sourceRoot,
  serverActionMap,
}: {
  sourceRoot: URL;
  serverActionMap: Map<string, CompiledAction>;
}): Plugin {
  return {
    name: "server-actions-plugin",
    setup(build) {
      build.initialOptions.metafile = true;
      let serverActions = new Set<ServerAction>();
      let rootPath = fileURLToPath(sourceRoot);

      function getPathActions(filePath: string) {
        return Array.from(serverActions).filter(
          (action) => action.path === filePath,
        );
      }

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseServer(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");

        if (contents.includes("use server")) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);
          let transformed = await serverFunctionTransform({
            input: {
              code: contents,
              language,
            },
            encryption: {
              key: envKey("TWOFOLD_SECRET_KEY"),
              module: "@twofold/framework/encryption",
            },
            moduleId,
          });

          for (let serverFunction of transformed.serverFunctions) {
            serverActions.add({
              id: `${moduleId}#${serverFunction}`,
              path,
              moduleId,
              export: serverFunction,
            });
          }

          return {
            contents: transformed.code,
            loader: "js",
          };
        }
      });

      build.onEnd((result) => {
        let metafile = result.metafile;

        if (!metafile) {
          throw new Error("Failed to get metafile");
        }

        for (let [outputFile, output] of Object.entries(metafile.outputs)) {
          let inputFiles = Object.keys(output.inputs);
          let actions = inputFiles.flatMap((inputFile) =>
            getPathActions(path.resolve(rootPath, inputFile)),
          );

          for (let action of actions) {
            let file = outputFile.split("/").at(-1);
            let hash = file?.split("-").at(-1)?.split(".")[0];

            if (!hash) {
              throw new Error(`Failed to get hash for ${outputFile}`);
            }

            serverActionMap.set(action.id, {
              id: action.id,
              moduleId: action.moduleId,
              hash,
              path: resolveCompiledOutputPath({
                sourceRoot,
                outputDir: rscCompiledDir,
                outputPath: outputFile,
              }),
              export: action.export,
            });
          }
        }
      });
    },
  };
}

function imagesPlugin({
  imagesMap,
  prefixPath,
}: {
  imagesMap: Map<string, Image>;
  prefixPath: string;
}): Plugin {
  return {
    name: "images",
    setup(build) {
      build.onLoad(
        { filter: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/ },
        async (args) => {
          let ext = path.extname(args.path);
          let name = path.basename(args.path, ext);
          let hash = await hashFile(args.path);
          let id = `${name}-${hash}${ext}`;
          let type = mime.contentType(ext) || "";
          let publicUrl = `${prefixPath}/${id}`;

          imagesMap.set(args.path, {
            id,
            type,
            path: args.path,
          });

          return {
            contents: `export default ${JSON.stringify(publicUrl)};`,
            loader: "js",
          };
        },
      );
    },
  };
}

function fontsPlugin({
  root,
  fontsMap,
  prefixPath,
}: {
  root: URL;
  fontsMap: Map<string, Font>;
  prefixPath: string;
}): Plugin {
  async function addFont(fontFile: string) {
    let font = fontsMap.get(fontFile);

    if (!font) {
      let ext = path.extname(fontFile);
      let name = path.basename(fontFile, ext);
      let hash = await hashFile(fontFile);
      let id = `${name}-${hash}${ext}`;
      let type = mime.contentType(ext) || "";

      font = {
        id,
        type,
        path: fontFile,
      };

      fontsMap.set(fontFile, font);
    }

    return font;
  }

  return {
    name: "fonts",
    setup(build) {
      let publicFolderUrl = new URL("./public/", root);

      build.onResolve({ filter: /\.(woff2)$/ }, async (args) => {
        if (!args.importer.endsWith(".css")) {
          return;
        }

        if (args.path.startsWith("/")) {
          let potentialPublicFontUrl = new URL(
            `.${args.path}`,
            publicFolderUrl,
          );
          let existsInPublic = await fileExists(potentialPublicFontUrl);
          let fontFile = existsInPublic
            ? fileURLToPath(potentialPublicFontUrl)
            : args.path;
          let font = await addFont(fontFile);

          return {
            external: true,
            path: `${prefixPath}/${font.id}`,
          };
        }

        if (args.path.startsWith("./")) {
          let fontFile = path.join(path.dirname(args.importer), args.path);
          let font = await addFont(fontFile);

          return {
            external: true,
            path: `${prefixPath}/${font.id}`,
          };
        }

        throw new Error(
          `Unexpected font import path: ${args.path} in ${args.importer}`,
        );
      });

      build.onLoad({ filter: /\.(woff2)$/ }, async (args) => {
        let font = await addFont(args.path);
        let publicUrl = `${prefixPath}/${font.id}`;

        return {
          contents: `export default ${JSON.stringify(publicUrl)};`,
          loader: "js",
        };
      });
    },
  };
}

function storesPlugin(): Plugin {
  return {
    name: "stores",
    setup(build) {
      let frameworkSrcPath = fileURLToPath(frameworkSrcDir);
      let storeUrl = new URL(
        "./backend/stores/rsc-store.js",
        frameworkCompiledDir,
      );

      build.onResolve({ filter: /\/stores\/rsc-store/ }, (args) => {
        if (args.importer.startsWith(frameworkSrcPath)) {
          return {
            external: true,
            path: storeUrl.href,
          };
        }
      });
    },
  };
}

function errorTemplatesPlugin({
  root,
  entries,
  pagesDir,
}: {
  root: URL;
  entries: EntriesOutput;
  pagesDir: URL;
}): Plugin {
  return {
    name: "error-templates-must-be-client-components",
    setup(build) {
      let rootPath = fileURLToPath(root);
      let errorsRegex = new RegExp(
        `^${fileURLToEscapedPath(pagesDir)}/.*\\.error\\.tsx$`,
      );

      build.onEnd((result) => {
        let metafile = result.metafile;
        if (!metafile) {
          throw new Error("Missing metafile");
        }

        let inputs = Object.keys(metafile.inputs)
          .filter((input) => input.endsWith("error.tsx"))
          .map((input) =>
            path.isAbsolute(input) ? input : path.resolve(rootPath, input),
          );
        let errors = inputs.reduce<PartialMessage[]>((errors, input) => {
          return errorsRegex.test(input) &&
            !entries.clientComponentEntryMap.has(input)
            ? [
                ...errors,
                {
                  text: "Error components must be client components",
                  location: {
                    file: input,
                    suggestion: 'Mark this file with "use client"',
                  },
                },
              ]
            : errors;
        }, []);

        return errors.length > 0 ? { errors } : null;
      });
    },
  };
}

function sourcePathsForRoot(root: URL) {
  let appPath = fileURLToPath(new URL("./app/", root));
  let frameworkSrcPath = fileURLToPath(frameworkSrcDir);

  return {
    framework: {
      pages: {
        notFound: path.join(
          frameworkSrcPath,
          "client",
          "pages",
          "not-found.tsx",
        ),
        unauthorized: path.join(
          frameworkSrcPath,
          "client",
          "pages",
          "unauthorized.tsx",
        ),
      },
      errorTemplates: {
        notFound: path.join(
          frameworkSrcPath,
          "client",
          "components",
          "error-templates",
          "not-found.tsx",
        ),
        unauthorized: path.join(
          frameworkSrcPath,
          "client",
          "components",
          "error-templates",
          "unauthorized.tsx",
        ),
      },
      outerRootWrapper: path.join(
        frameworkSrcPath,
        "client",
        "components",
        "outer-root-wrapper.tsx",
      ),
      routeStackPlaceholder: path.join(
        frameworkSrcPath,
        "client",
        "components",
        "route-stack",
        "placeholder.tsx",
      ),
      catchBoundary: path.join(
        frameworkSrcPath,
        "client",
        "components",
        "boundaries",
        "catch-boundary.tsx",
      ),
    },
    app: {
      globalMiddleware: path.join(appPath, "middleware.ts"),
      notFound: path.join(appPath, "pages", "errors", "not-found.tsx"),
      unauthorized: path.join(appPath, "pages", "unauthorized.error.tsx"),
    },
  };
}

let rscCompiledDir = new URL("./rsc/", appCompiledDir);

function resolveCompiledOutputPath({
  sourceRoot,
  outputDir,
  outputPath,
}: {
  sourceRoot: URL;
  outputDir: URL;
  outputPath: string;
}) {
  let compiledPath = path.resolve(fileURLToPath(sourceRoot), outputPath);
  let outputDirPath = fileURLToPath(outputDir);
  let relativePath = path.relative(outputDirPath, compiledPath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Compiled output is outside appCompiledDir: ${outputPath}`);
  }

  return compiledPath;
}
