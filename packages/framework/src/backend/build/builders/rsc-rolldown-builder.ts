import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { transform as clientComponentTransform } from "@twofold/client-component-transforms";
import { envKey, transform as serverFunctionTransform } from "@twofold/server-function-transforms";
import { createHash } from "node:crypto";
import { glob, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform as transformCss } from "lightningcss";
import * as mime from "mime-types";
import { build as rolldownBuild, type Plugin } from "rolldown";
import { frameworkCompiledDir, frameworkSrcDir } from "../../files.js";
import { shouldIgnoreUseClient, shouldIgnoreUseServer } from "../helpers/excluded.js";
import { fileExists, hashFile } from "../helpers/file.js";
import { pathToLanguage } from "../helpers/languages.js";
import { LazyValue } from "../helpers/lazy-value.js";
import { getModuleId } from "../helpers/module.js";
import { API } from "../rsc/api.js";
import { CatchBoundary } from "../rsc/catch-boundary.js";
import { ErrorTemplate } from "../rsc/error-template.js";
import { Generic } from "../rsc/generic.js";
import { Layout } from "../rsc/layout.js";
import { Page } from "../rsc/page.js";
import { Wrapper } from "../rsc/wrapper.js";
import { Builder } from "./builder.js";
import type { EntriesOutput } from "./entries-builder.js";

type BuilderInput = {
  readonly environment: "development" | "production";
  readonly entries: EntriesOutput;
};

type Asset = {
  readonly id: string;
  readonly type: string;
  readonly path: string;
};

type Action = {
  readonly id: string;
  readonly moduleId: string;
  readonly export: string;
};

type CompiledAction = Action & {
  readonly path: string;
  readonly hash: string;
};

type CompiledEntry = {
  readonly file: string;
  readonly css?: string;
};

type OutputData = {
  readonly sourceRoot: string;
  readonly files: readonly string[];
  readonly entries: Readonly<Record<string, CompiledEntry>>;
  readonly serverActionMap: Readonly<Record<string, CompiledAction>>;
  readonly imagesMap: Readonly<Record<string, Asset>>;
  readonly fontsMap: Readonly<Record<string, Asset>>;
};

let frameworkRoot = fileURLToPath(frameworkSrcDir);

let frameworkEntries = {
  notFound: frameworkFile("pages/not-found.tsx"),
  unauthorized: frameworkFile("pages/unauthorized.tsx"),
  notFoundTemplate: frameworkFile("components/error-templates/not-found.tsx"),
  unauthorizedTemplate: frameworkFile("components/error-templates/unauthorized.tsx"),
  outerRootWrapper: frameworkFile("components/outer-root-wrapper.tsx"),
  routeStackPlaceholder: frameworkFile("components/route-stack/placeholder.tsx"),
  catchBoundary: frameworkFile("components/boundaries/catch-boundary.tsx"),
};

function frameworkFile(file: string) {
  return fileURLToPath(new URL(`./client/${file}`, frameworkSrcDir));
}

export class RSCRolldownBuilder extends Builder<BuilderInput, RSCRolldownOutput> {
  async build({ environment, entries }: BuilderInput) {
    let cwd = fileURLToPath(entries.sourceRoot);
    let outputDir = path.join(cwd, ".twofold/rsc");
    let appDir = path.join(cwd, "app");
    let middleware = path.join(appDir, "middleware.ts");

    let routeFiles = await Array.fromAsync(
      glob(
        [
          "app/pages/**/*.page.tsx",
          "app/pages/**/layout.tsx",
          "app/pages/**/*.api.ts",
          "app/pages/**/*.api.tsx",
          "app/pages/**/*.error.tsx",
        ],
        { cwd },
      ),
    );

    let routes = new Set(routeFiles.map((file) => path.resolve(cwd, file)));

    let { notFoundTemplate, unauthorizedTemplate, ...requiredFrameworkEntries } = frameworkEntries;

    let input = [
      ...new Set([
        ...routes,
        ...entries.serverActionEntryMap.keys(),
        ...((await fileExists(middleware)) ? [middleware] : []),
        ...(!routes.has(path.join(appDir, "pages/not-found.error.tsx")) ? [notFoundTemplate] : []),
        ...(!routes.has(path.join(appDir, "pages/unauthorized.error.tsx"))
          ? [unauthorizedTemplate]
          : []),
        ...Object.values(requiredFrameworkEntries),
      ]),
    ].sort();

    let images = new Map<string, Asset>();
    let fonts = new Map<string, Asset>();
    let actions = new Map<string, Action[]>();
    let routeCss = new Map<string, string>();

    let result = await rolldownBuild({
      cwd,
      input,
      platform: "node",
      tsconfig: true,

      resolve: {
        conditionNames: ["react-server", "module"],
      },

      transform: {
        jsx: {
          runtime: "automatic",
        },
      },

      external: (id) =>
        entries.externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),

      preserveEntrySignatures: "strict",

      onLog(_level, log) {
        if (log.code === "UNRESOLVED_IMPORT") {
          throw new Error(`Could not resolve import "${log.exporter}" in ${log.id}`);
        }
      },

      plugins: [
        directivesPlugin(actions, entries.clientComponentEntryMap, routes),
        rscStorePlugin(),
        assetsPlugin(images, fonts),
        routeCssPlugin({
          appDir,
          routes,
          fonts,
          routeCss,
          minify: environment === "production",
        }),
      ],

      output: {
        dir: outputDir,
        format: "esm",
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        hashCharacters: "base36",
      },
    });

    let compiledEntries = new Map<string, CompiledEntry>();
    let compiledActions = new Map<string, CompiledAction>();

    for (let chunk of result.output) {
      if (chunk.type !== "chunk" || !chunk.isEntry || !chunk.facadeModuleId) continue;

      let id = chunk.facadeModuleId;
      let css = routeCss.get(id);

      compiledEntries.set(id, {
        file: chunk.fileName,
        ...(css ? { css } : {}),
      });

      for (let action of actions.get(id) ?? []) {
        if (!chunk.exports.includes(action.export)) {
          throw new Error(`Missing server action export ${action.export} in ${id}`);
        }

        let hash = path.basename(chunk.fileName, ".js").split("-").at(-1)!;

        compiledActions.set(action.id, {
          ...action,
          path: path.join(outputDir, chunk.fileName),
          hash,
        });
      }
    }

    for (let [id, moduleActions] of actions) {
      if (!compiledEntries.has(id) && moduleActions.length) {
        throw new Error(`Missing server action entry for ${id}`);
      }
    }

    return new RSCRolldownOutput({
      sourceRoot: entries.sourceRoot.href,
      files: result.output.map((file) => file.fileName).sort(),
      entries: Object.fromEntries(compiledEntries),
      serverActionMap: Object.fromEntries(compiledActions),
      imagesMap: Object.fromEntries(images),
      fontsMap: Object.fromEntries(fonts),
    });
  }

  load(data: OutputData) {
    return new RSCRolldownOutput(data);
  }
}

export class RSCRolldownOutput {
  readonly #data: OutputData;
  readonly #root: string;
  readonly #outputDir: string;
  readonly files: readonly string[];
  readonly serverActionMap: ReadonlyMap<string, CompiledAction>;
  readonly imagesMap: ReadonlyMap<string, Asset>;
  readonly fontsMap: ReadonlyMap<string, Asset>;

  constructor(data: OutputData) {
    this.#data = data;
    this.#root = fileURLToPath(data.sourceRoot);
    this.#outputDir = path.join(this.#root, ".twofold/rsc");
    this.files = data.files;
    this.serverActionMap = new Map(Object.entries(data.serverActionMap));
    this.imagesMap = new Map(Object.entries(data.imagesMap));
    this.fontsMap = new Map(Object.entries(data.fontsMap));
  }

  readonly #routes = new LazyValue(() => this.#buildRoutes());

  readonly #tree = new LazyValue(() => {
    let { layouts, pages, templates, boundaries, wrapper } = this.#routes.value;

    let root = layouts.find((layout) => layout.path === "/");

    if (!root) {
      throw new Error("No root layout");
    }

    for (let layout of layouts) {
      if (layout !== root) {
        root.addChild(layout);
      }
    }

    for (let node of [...boundaries, ...pages, ...templates]) {
      root.addChild(node);
    }

    root.addWrapper(wrapper);

    return root.tree;
  });

  readonly #css = new LazyValue(() => [
    ...new Set(
      Object.values(this.#data.entries).flatMap((entry) => (entry.css ? [entry.css] : [])),
    ),
  ]);

  readonly #serverManifest = new LazyValue(() =>
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

  readonly #serverActionModuleMap = new LazyValue(() =>
    Object.fromEntries(
      Array.from(this.serverActionMap.values(), (action) => [
        action.moduleId,
        { path: action.path },
      ]),
    ),
  );

  get apiEndpoints() {
    return this.#routes.value.apis;
  }

  get css() {
    return this.#css.value;
  }

  get serverManifest() {
    return this.#serverManifest.value;
  }

  get serverActionModuleMap(): Readonly<Record<string, { readonly path: string } | undefined>> {
    return this.#serverActionModuleMap.value;
  }

  #entryPath(source: string) {
    let entry = this.#data.entries[source];

    if (!entry) {
      throw new Error(`Failed to get compiled entry point: ${source}`);
    }

    return path.join(this.#outputDir, entry.file);
  }

  hasMiddleware() {
    return Object.hasOwn(this.#data.entries, path.join(this.#root, "app/middleware.ts"));
  }

  get middlewarePath() {
    return this.#entryPath(path.join(this.#root, "app/middleware.ts"));
  }

  get routeStackPlaceholderPath() {
    return this.#entryPath(frameworkEntries.routeStackPlaceholder);
  }

  findPageForPath(pathname: string) {
    return this.#tree.value.findPageForPath(pathname);
  }

  serialize() {
    return this.#data;
  }

  async warm() {
    let { layouts, pages, templates, boundaries, apis, wrapper } = this.#routes.value;

    await Promise.all([
      ...[...layouts, ...pages, ...templates, ...boundaries, ...apis, wrapper].map((node) =>
        node.preload(),
      ),

      ...[...new Set(Array.from(this.serverActionMap.values(), (action) => action.path))].map(
        (file) => import(pathToFileURL(file).href),
      ),

      this.hasMiddleware() ? import(pathToFileURL(this.middlewarePath).href) : undefined,

      import(pathToFileURL(this.routeStackPlaceholderPath).href),
    ]);
  }

  #buildRoutes() {
    let pagesDir = path.join(this.#root, "app/pages");
    let pages: Page[] = [];
    let layouts: Layout[] = [];
    let apis: API[] = [];
    let templates: ErrorTemplate[] = [];
    let boundaryPaths = new Set(["/"]);
    let routeStackPlaceholder = new Generic({
      fileUrl: pathToFileURL(this.routeStackPlaceholderPath),
    });

    for (let [source, entry] of Object.entries(this.#data.entries)) {
      if (!source.startsWith(`${pagesDir}${path.sep}`)) {
        continue;
      }

      let relative = path.relative(pagesDir, source).split(path.sep).join("/");
      let fileUrl = pathToFileURL(path.join(this.#outputDir, entry.file));

      if (relative.endsWith(".page.tsx")) {
        pages.push(
          new Page({
            path: indexRoute(relative.slice(0, -".page.tsx".length)),
            css: entry.css,
            fileUrl,
          }),
        );
      } else if (relative === "layout.tsx" || relative.endsWith("/layout.tsx")) {
        let directory = path.posix.dirname(relative);
        layouts.push(
          new Layout({
            path: directory === "." ? "/" : `/${directory}`,
            css: entry.css,
            fileUrl,
            routeStackPlaceholder,
          }),
        );
      } else if (/\.api\.tsx?$/.test(relative)) {
        apis.push(
          new API({
            path: indexRoute(relative.replace(/\.api\.tsx?$/, "")),
            fileUrl,
          }),
        );
      } else if (relative.endsWith(".error.tsx")) {
        let template = relative.slice(0, -".error.tsx".length);
        let tag = path.posix.basename(template);
        let isRootOverride = template === "not-found" || template === "unauthorized";

        templates.push(
          new ErrorTemplate({
            tag,
            path: isRootOverride ? "/" : `/${template}`,
            fileUrl,
          }),
        );
        let parent = path.posix.dirname(template);
        if (parent !== ".") {
          boundaryPaths.add(`/${parent}`);
        }
      }
    }

    for (let [tag, fallback, page] of [
      ["not-found", frameworkEntries.notFoundTemplate, frameworkEntries.notFound],
      ["unauthorized", frameworkEntries.unauthorizedTemplate, frameworkEntries.unauthorized],
    ] as const) {
      if (!templates.some((template) => template.tag === tag && template.path === "/")) {
        templates.push(
          new ErrorTemplate({
            tag,
            path: "/",
            fileUrl: pathToFileURL(this.#entryPath(fallback)),
          }),
        );
      }

      pages.push(
        new Page({
          path: `/__tf/errors/${tag}`,
          fileUrl: pathToFileURL(this.#entryPath(page)),
        }),
      );
    }

    let boundaryUrl = pathToFileURL(this.#entryPath(frameworkEntries.catchBoundary));
    let boundaries = [...boundaryPaths].map(
      (path) =>
        new CatchBoundary({
          path,
          fileUrl: boundaryUrl,
          routeStackPlaceholder,
        }),
    );

    let wrapper = new Wrapper({
      path: "/",
      fileUrl: pathToFileURL(this.#entryPath(frameworkEntries.outerRootWrapper)),
    });

    return {
      pages,
      layouts,
      apis,
      templates,
      boundaries,
      wrapper,
    };
  }
}

function indexRoute(relative: string) {
  return `/${relative.replace(/(^|\/)index$/, "")}`;
}

function directivesPlugin(
  actions: Map<string, Action[]>,
  clientEntries: EntriesOutput["clientComponentEntryMap"],
  routes: ReadonlySet<string>,
): Plugin {
  return {
    name: "rsc-directives",
    buildStart() {
      for (let file of routes) {
        if (file.endsWith(".error.tsx") && !clientEntries.has(file)) {
          this.error(
            `Error components must be client components: ${file}\nMark this file with "use client"`,
          );
        }
      }
    },

    transform: {
      filter: {
        id: /\.(ts|tsx|js|jsx|mjs)$/,
        code: /use (client|server)/,
      },

      async handler(code, id) {
        let moduleId = getModuleId(id);

        let options = {
          input: {
            code,
            language: pathToLanguage(id),
          },
          moduleId,
        };

        if (code.includes("use client") && !shouldIgnoreUseClient(id)) {
          let result = await clientComponentTransform({
            ...options,
            rscClientPath: "react-server-dom-webpack/server.edge",
          });

          return {
            code: result.code,
            moduleType: "js",
          };
        }

        if (code.includes("use server") && !shouldIgnoreUseServer(id)) {
          let result = await serverFunctionTransform({
            ...options,
            encryption: {
              key: envKey("TWOFOLD_SECRET_KEY"),
              module: "@twofold/framework/encryption",
            },
          });

          actions.set(
            id,
            result.serverFunctions.map((name) => ({
              id: `${moduleId}#${name}`,
              moduleId,
              export: name,
            })),
          );

          return {
            code: result.code,
            moduleType: "js",
          };
        }
      },
    },
  };
}

function rscStorePlugin(): Plugin {
  return {
    name: "rsc-store-singleton",
    resolveId: {
      filter: {
        id: /\/stores\/rsc-store/,
      },

      handler(_id, importer) {
        if (importer?.startsWith(frameworkRoot)) {
          return {
            id: new URL("./backend/stores/rsc-store.js", frameworkCompiledDir).href,
            external: true,
          };
        }
      },
    },
  };
}

async function recordAsset(file: string, assets: Map<string, Asset>, kind: "fonts" | "images") {
  let asset = assets.get(file);

  if (!asset) {
    let ext = path.extname(file);

    asset = {
      id: `${path.basename(file, ext)}-${await hashFile(file)}${ext}`,
      type: mime.contentType(ext) || "",
      path: file,
    };

    assets.set(file, asset);
  }

  return `/__tf/assets/${kind}/${asset.id}`;
}

function assetsPlugin(images: Map<string, Asset>, fonts: Map<string, Asset>): Plugin {
  return {
    name: "rsc-assets",
    load: {
      filter: {
        id: /\.(png|jpe?g|gif|webp|avif|svg|woff2)$/,
      },
      async handler(id) {
        let url = id.endsWith(".woff2")
          ? await recordAsset(id, fonts, "fonts")
          : await recordAsset(id, images, "images");

        return {
          code: `export default ${JSON.stringify(url)};`,
          moduleType: "js",
        };
      },
    },
  };
}

function routeCssPlugin({
  appDir,
  routes,
  fonts,
  routeCss,
  minify,
}: {
  appDir: string;
  routes: ReadonlySet<string>;
  fonts: Map<string, Asset>;
  routeCss: Map<string, string>;
  minify: boolean;
}): Plugin {
  let stylesheets = new Set<string>();
  let compiled = new Map<string, Promise<string>>();

  async function compileStylesheet(file: string) {
    let base = path.dirname(file);

    let compiler = await compile(await readFile(file, "utf8"), {
      base,
      from: file,
      shouldRewriteUrls: true,
      onDependency() {},
    });

    let sources = [...compiler.sources];

    if (compiler.root === null) {
      sources.push({
        base: appDir,
        pattern: "**/*",
        negated: false,
      });
    } else if (compiler.root !== "none") {
      sources.push({
        ...compiler.root,
        negated: false,
      });
    }

    let css = compiler.build(compiler.features > 0 ? new Scanner({ sources }).scan() : []);
    let urls = new Set<string>();
    let buffer = Buffer.from(css);
    let options = {
      filename: file,
      code: buffer,
      errorRecovery: true,
    };

    transformCss({
      ...options,
      visitor: {
        Url({ url }) {
          urls.add(url);
        },
      },
    });

    let replacements = new Map<string, string>();

    await Promise.all(
      [...urls].map(async (url) => {
        if (!url.endsWith(".woff2") || /^(?:[\w+.-]+:|\/\/)/.test(url)) {
          return;
        }

        let font = url.startsWith("/")
          ? path.resolve(appDir, "../public", `.${url}`)
          : path.resolve(base, url);

        if (url.startsWith("/") && !(await fileExists(font))) {
          font = url;
        }

        replacements.set(url, await recordAsset(font, fonts, "fonts"));
      }),
    );

    if (!replacements.size) {
      return css;
    }

    return transformCss({
      ...options,
      visitor: {
        Url(value) {
          let replacement = replacements.get(value.url);
          if (replacement) {
            return {
              ...value,
              url: replacement,
            };
          }
        },
      },
    }).code.toString();
  }

  return {
    name: "rsc-route-css",
    load: {
      filter: {
        id: /\.css$/,
      },

      handler(id) {
        stylesheets.add(id);
        return {
          code: "",
          moduleType: "js",
        };
      },
    },

    async generateBundle() {
      let assets = new Set<string>();

      for (let route of [...routes].sort()) {
        if (!route.endsWith(".page.tsx") && path.basename(route) !== "layout.tsx") {
          continue;
        }

        let visited = new Set<string>();
        let dynamicImports = new Set<string>();
        let sheets: string[] = [];

        let visit = (id: string) => {
          if (visited.has(id)) {
            return;
          }

          visited.add(id);

          if (stylesheets.has(id)) {
            sheets.push(id);
            return;
          }

          let module = this.getModuleInfo(id);
          if (!module) {
            return;
          }

          for (let dependency of module.importedIds) {
            visit(dependency);
          }

          for (let dependency of module.dynamicallyImportedIds) {
            dynamicImports.add(dependency);
          }
        };

        visit(route);

        for (let dependency of dynamicImports) {
          visit(dependency);
        }

        if (!sheets.length) {
          continue;
        }

        let parts = await Promise.all(
          sheets.map((file) => {
            let result = compiled.get(file);
            if (!result) {
              result = compileStylesheet(file);
              compiled.set(file, result);
            }

            return result;
          }),
        );

        let { code } = optimize(parts.join("\n"), { minify });
        let hash = createHash("sha256").update(code).digest("hex").slice(0, 16);
        let filename = `styles-${hash}.css`;

        routeCss.set(route, filename);

        if (!assets.has(filename)) {
          assets.add(filename);
          this.emitFile({
            type: "asset",
            fileName: `css/${filename}`,
            source: code,
          });
        }
      }
    },
  };
}
