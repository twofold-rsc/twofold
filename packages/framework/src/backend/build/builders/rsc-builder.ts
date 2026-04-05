import { Metafile, PartialMessage, build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "url";
import {
  appCompiledDir,
  appAppDir,
  frameworkCompiledDir,
  frameworkSrcDir,
  cwd,
} from "../../files.js";
import { clientComponentProxyPlugin } from "../plugins/client-component-proxy-plugin.js";
import { serverActionsPlugin } from "../plugins/server-actions-plugin.js";
import { getCompiledEntrypoint } from "../helpers/compiled-entrypoint.js";
import path from "path";
import { Page } from "../rsc/page.js";
import { Wrapper } from "../rsc/wrapper.js";
import { fileExists, fileURLToEscapedPath } from "../helpers/file.js";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { Layout } from "../rsc/layout.js";
import { API } from "../rsc/api.js";
import { esbuildPluginTailwind } from "@ryanto/esbuild-plugin-tailwind";
import { Image, imagesPlugin } from "../plugins/images-plugin.js";
import { Font, fontsPlugin } from "../plugins/fonts-plugin.js";
import { excludePackages } from "../externals/predefined-externals.js";
import { EntriesBuilder } from "./entries-builder.js";
import { ErrorTemplate } from "../rsc/error-template.js";
import { Generic } from "../rsc/generic.js";
import { CatchBoundary } from "../rsc/catch-boundary.js";
import { invariant } from "../../utils/invariant.js";
import { Node } from "../rsc/tree-node.js";
import { CompiledServerAction } from "../rsc/compiled-server-action.js";

interface ApplicationTreeProps {
  metafile: Metafile | undefined;
  serverActionMap: Map<string, CompiledServerAction>;
  routeStackPlaceholder: Generic;
  compiledPathForEntry: (entryPath: string) => string;
}

/**
 * We need to ensure that all of the constructed values used by the application
 * are the values that exist in the root tree, otherwise objects that would be
 * constructed dynamically would not have access to 'parent'.
 *
 * This did not matter in the past for API routes, but now that we use the tree
 * to lookup authentication policies, we want to make sure nothing ever constructs
 * something for routing without the appropriate parent context set.
 */
class ApplicationTree {
  #pages: Page[];
  #layouts: Layout[];
  #apiEndpoints: API[];
  #errorTemplates: ErrorTemplate[];
  #catchBoundaries: CatchBoundary[];
  #outerRootWrapper: Wrapper;
  #serverActionMap: Map<string, CompiledServerAction>;
  #unauthorizedPage: Page;
  #notFoundPage: Page;
  #root: Layout;

  constructor(props: ApplicationTreeProps) {
    this.#pages = ApplicationTree.#constructPages(props.metafile);
    this.#layouts = ApplicationTree.#constructLayouts(
      props.metafile,
      props.routeStackPlaceholder,
    );
    this.#apiEndpoints = ApplicationTree.#constructApiEndpoints(props.metafile);
    this.#errorTemplates = ApplicationTree.#constructErrorTemplates(
      props.metafile,
    );
    this.#catchBoundaries = ApplicationTree.#constructCatchBoundaries(
      props.metafile,
      props.routeStackPlaceholder,
      props.compiledPathForEntry,
      this.#errorTemplates,
    );
    this.#outerRootWrapper = ApplicationTree.#constructOuterRootWrapper(
      props.compiledPathForEntry,
    );
    this.#serverActionMap = props.serverActionMap;
    this.#unauthorizedPage = ApplicationTree.#constructUnauthorizedPage(
      props.metafile,
    );
    this.#notFoundPage = ApplicationTree.#constructNotFoundPage(props.metafile);
    this.#root = this.#constructRoot();
  }

  findPageForPath(path: string) {
    return this.#root.tree.findPageForPath(path);
  }

  get root() {
    return this.#root;
  }

  get pages() {
    return this.#pages;
  }

  get layouts() {
    return this.#layouts;
  }

  get apiEndpoints() {
    return this.#apiEndpoints;
  }

  get notFoundPage() {
    return this.#notFoundPage;
  }

  get outerRootWrapper() {
    return this.#outerRootWrapper;
  }

  get errorTemplates() {
    return this.#errorTemplates;
  }

  get catchBoundaries() {
    return this.#catchBoundaries;
  }

  static #constructPages(metafile: Metafile | undefined) {
    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "app/pages/";
    let pageSuffix = ".page.tsx";

    let cssUrl = new URL("./rsc/css/", appCompiledDir);
    let cssPath = fileURLToPath(cssUrl);
    let cssPrefix = cssPath.slice(process.cwd().length + 1);

    let keys = Object.keys(outputs);
    return keys
      .filter((key) => {
        let entryPoint = outputs[key]?.entryPoint;
        return (
          entryPoint &&
          entryPoint.startsWith(prefix) &&
          entryPoint.endsWith(pageSuffix)
        );
      })
      .map((key) => {
        let output = outputs[key];
        if (!output) {
          throw new Error("No output found for key");
        }

        let entryPoint = output.entryPoint;
        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let path = entryPoint.slice(prefix.length).slice(0, -pageSuffix.length);
        if (path === "index" || path.endsWith("/index")) {
          path = path.slice(0, -6);
        }
        path = `/${path}`;

        return new Page({
          path,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
        });
      });
  }

  static #constructLayouts(
    metafile: Metafile | undefined,
    routeStackPlaceholder: Generic,
  ) {
    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "app/pages/";
    let layoutSuffix = "/layout.tsx";

    let cssUrl = new URL("./rsc/css/", appCompiledDir);
    let cssPath = fileURLToPath(cssUrl);
    let cssPrefix = cssPath.slice(process.cwd().length + 1);

    let keys = Object.keys(outputs);

    return keys
      .filter((key) => {
        let entryPoint = outputs[key]?.entryPoint;
        return (
          entryPoint &&
          entryPoint.startsWith(prefix) &&
          entryPoint.endsWith(layoutSuffix)
        );
      })
      .map((key) => {
        let output = outputs[key];
        if (!output) {
          throw new Error("No output found for key");
        }

        let entryPoint = output.entryPoint;
        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let path = entryPoint
          .slice(prefix.length)
          .slice(0, -layoutSuffix.length);

        return new Layout({
          path: `/${path}`,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
          routeStackPlaceholder,
        });
      });
  }

  static #constructApiEndpoints(metafile: Metafile | undefined) {
    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "app/pages/";
    let apiSuffix = /\.api\.tsx?$/;

    let keys = Object.keys(outputs);
    return keys
      .filter((key) => {
        let entryPoint = outputs[key]?.entryPoint;
        return (
          entryPoint &&
          entryPoint.startsWith(prefix) &&
          apiSuffix.test(entryPoint)
        );
      })
      .map((key) => {
        let output = outputs[key];
        if (!output) {
          throw new Error("No output found for key");
        }

        let entryPoint = output.entryPoint;
        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let suffixMatch = apiSuffix.exec(entryPoint);
        if (!suffixMatch) {
          throw new Error("No suffix match");
        }

        // either api.ts or api.tsx
        let suffix = suffixMatch[0];

        let path = entryPoint.slice(prefix.length).slice(0, -suffix.length);
        if (path === "index" || path.endsWith("/index")) {
          path = path.slice(0, -6);
        }
        path = `/${path}`;

        return new API({
          path,
          fileUrl: new URL(key, baseUrl),
        });
      });
  }

  static #constructErrorTemplates(metafile: Metafile | undefined) {
    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "app/pages/";
    let errorSuffix = ".error.tsx";

    let keys = Object.keys(outputs);
    let templates = keys
      .filter((key) => {
        let entryPoint = outputs[key]?.entryPoint;
        return (
          entryPoint &&
          entryPoint.startsWith(prefix) &&
          entryPoint.endsWith(errorSuffix)
        );
      })
      .map((key) => {
        let output = outputs[key];
        if (!output) {
          throw new Error("No output found for key");
        }

        let entryPoint = output.entryPoint;
        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let path = `/${entryPoint
          .slice(prefix.length)
          .slice(0, -errorSuffix.length)}`;

        let tag = path.split("/").at(-1) ?? "unknown";

        return new ErrorTemplate({
          tag,
          path,
          fileUrl: new URL(key, baseUrl),
        });
      });

    // if there is no root level unauthorized template we will add the default
    if (!templates.some((t) => t.tag === "unauthorized" && t.path === "/")) {
      let defaultUnauthorizedPath = getCompiledEntrypoint(
        srcPaths.framework.errorTemplates.unauthorized,
        metafile,
      );

      templates.push(
        new ErrorTemplate({
          tag: "unauthorized",
          path: "/",
          fileUrl: pathToFileURL(defaultUnauthorizedPath),
        }),
      );
    }

    // if there is no root level not found template we will add the default
    if (!templates.some((t) => t.tag === "not-found" && t.path === "/")) {
      let defaultNotFoundPath = getCompiledEntrypoint(
        srcPaths.framework.errorTemplates.notFound,
        metafile,
      );

      templates.push(
        new ErrorTemplate({
          tag: "not-found",
          path: "/",
          fileUrl: pathToFileURL(defaultNotFoundPath),
        }),
      );
    }

    return templates;
  }

  static #constructCatchBoundaries(
    metafile: Metafile | undefined,
    routeStackPlaceholder: Generic,
    compiledPathForEntry: (entryPath: string) => string,
    errorTemplates: ErrorTemplate[],
  ) {
    let catchBoundaryPath = compiledPathForEntry(
      srcPaths.framework.catchBoundary,
    );
    let catchBoundaryUrl = pathToFileURL(catchBoundaryPath);

    let catchBoundaryMap = new Map<string, CatchBoundary>();

    // always have a root level catch boundary
    catchBoundaryMap.set(
      "/",
      new CatchBoundary({
        path: "/",
        fileUrl: catchBoundaryUrl,
        routeStackPlaceholder,
      }),
    );

    for (let errorTemplate of errorTemplates) {
      let path =
        errorTemplate.path === "/"
          ? "/"
          : "/" +
            errorTemplate.path
              .split("/")
              .filter(Boolean)
              .slice(0, -1)
              .join("/");

      let catchBoundary = catchBoundaryMap.get(path);

      if (!catchBoundary) {
        catchBoundary = new CatchBoundary({
          path,
          fileUrl: catchBoundaryUrl,
          routeStackPlaceholder,
        });

        catchBoundaryMap.set(path, catchBoundary);
      }
    }

    return [...catchBoundaryMap.values()];
  }

  static #constructOuterRootWrapper(
    compiledPathForEntry: (entryPath: string) => string,
  ) {
    let outputFilePath = compiledPathForEntry(
      srcPaths.framework.outerRootWrapper,
    );
    let outputFileUrl = pathToFileURL(outputFilePath);

    let wrapper = new Wrapper({
      path: "/",
      fileUrl: outputFileUrl,
    });

    return wrapper;
  }

  static #constructUnauthorizedPage(metafile: Metafile | undefined) {
    invariant(metafile, "Could not find metafile");

    let entryPoint = srcPaths.framework.pages.unauthorized;
    let outputFile = getCompiledEntrypoint(entryPoint, metafile);

    let page = new Page({
      path: "/__tf/errors/unauthorized",
      fileUrl: pathToFileURL(outputFile),
    });

    return page;
  }

  static #constructNotFoundPage(metafile: Metafile | undefined) {
    invariant(metafile, "Could not find metafile");

    let entryPoint = srcPaths.framework.pages.notFound;
    let outputFile = getCompiledEntrypoint(entryPoint, metafile);

    let page = new Page({
      path: "/__tf/errors/not-found",
      fileUrl: pathToFileURL(outputFile),
    });

    return page;
  }

  #constructRoot() {
    let pages = this.#pages;
    let layouts = this.#layouts;
    let apiEndpoints = this.#apiEndpoints;
    let serverActions = this.#serverActionMap.values();
    let errorTemplates = this.#errorTemplates;
    let catchBoundaries = this.#catchBoundaries;
    let outerRootWrapper = this.#outerRootWrapper;

    let root = layouts.find((layout) => layout.path === "/");
    let otherLayouts = layouts.filter((layout) => layout.path !== "/");

    if (!root) {
      throw new Error("No root layout");
    }

    otherLayouts.forEach((layout) => root.addChild(layout));
    catchBoundaries.forEach((catchBoundary) => root.addChild(catchBoundary));
    pages.forEach((page) => root.addChild(page));
    apiEndpoints.forEach((apiEndpoint) => root.addChild(apiEndpoint));
    serverActions.forEach((serverAction) => root.addChild(serverAction));
    errorTemplates.forEach((errorTemplate) => root.addChild(errorTemplate));

    root.addChild(this.#unauthorizedPage);
    root.addChild(this.#notFoundPage);

    root.addWrapper(outerRootWrapper);

    return root;
  }
}

export class RSCBuilder extends Builder {
  readonly name = "rsc";

  #metafile?: Metafile | undefined;
  #entriesBuilder: EntriesBuilder;
  #build: Build;
  #serverActionMap = new Map<string, CompiledServerAction>();
  #imagesMap = new Map<string, Image>();
  #fontsMap = new Map<string, Font>();
  #cachedApplicationTree: ApplicationTree | undefined = undefined;

  constructor({
    entriesBuilder,
    build,
  }: {
    entriesBuilder: EntriesBuilder;
    build: Build;
  }) {
    super();
    this.#entriesBuilder = entriesBuilder;
    this.#build = build;
  }

  get serverActionMap() {
    return this.#serverActionMap;
  }

  get imagesMap() {
    return this.#imagesMap;
  }

  get fontsMap() {
    return this.#fontsMap;
  }

  get entries() {
    return this.#entriesBuilder;
  }

  get #applicationTree() {
    if (this.#cachedApplicationTree !== undefined) {
      return this.#cachedApplicationTree;
    }
    this.#cachedApplicationTree = new ApplicationTree({
      metafile: this.#metafile,
      serverActionMap: this.#serverActionMap,
      routeStackPlaceholder: this.routeStackPlaceholder,
      compiledPathForEntry: (path) => this.compiledPathForEntry(path),
    });
    return this.#cachedApplicationTree;
  }

  async setup() {}

  async build() {
    let builder = this;

    let hasMiddleware = await this.hasMiddleware();
    let middlewareEntry = hasMiddleware ? [srcPaths.app.globalMiddleware] : [];

    let hasRootAuth = await this.hasRootAuth();
    let rootAuthEntry = hasRootAuth ? [srcPaths.app.rootAuth] : [];

    let notFoundTemplateEntry = await this.notFoundTemplateSrcPath();
    let unauthorizedTemplateEntry =
      await this.unauthorizedErrorTemplateSrcPath();

    // files need to be sorted for deterministic builds
    let serverActionEntries = Array.from(
      this.#entriesBuilder.serverActionEntryMap.keys(),
    ).sort();

    this.#serverActionMap = new Map();
    this.#imagesMap = new Map();
    this.#fontsMap = new Map();
    this.#metafile = undefined;
    this.clearError();

    try {
      let appConfig = await this.#build.getAppConfig();
      let userDefinedExternalPackages = appConfig.externalPackages ?? [];
      let discoveredExternals = this.#entriesBuilder.discoveredExternals;

      let result = await build({
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
          ...rootAuthEntry,
          ...serverActionEntries,
          notFoundTemplateEntry,
          unauthorizedTemplateEntry,
          srcPaths.framework.pages.unauthorized,
          srcPaths.framework.pages.notFound,
          srcPaths.framework.outerRootWrapper,
          srcPaths.framework.routeStackPlaceholder,
          srcPaths.framework.catchBoundary,
        ],
        outdir: "./.twofold/rsc/",
        outbase: "app",
        entryNames: "[ext]/[name]-[hash]",
        external: [
          ...excludePackages,
          ...userDefinedExternalPackages,
          ...discoveredExternals,
        ],
        conditions: ["react-server", "module"],
        platform: "node",
        splitting: true,
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          clientComponentProxyPlugin({ builder }),
          serverActionsPlugin({ builder }),
          esbuildPluginTailwind({
            base: fileURLToPath(appAppDir),
            minify: this.#build.name === "production",
          }),
          imagesPlugin({
            builder,
            prefixPath: "/__tf/assets/images",
          }),
          fontsPlugin({
            builder,
            prefixPath: "/__tf/assets/fonts",
          }),

          {
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
          },

          {
            name: "error-templates-must-be-client-components",
            setup(build) {
              let pagesDir = new URL("./pages", appAppDir);
              let errorsRegex = `^${fileURLToEscapedPath(pagesDir)}/.*\\.error\\.tsx$`;

              function isClientComponent(file: string) {
                return builder.#entriesBuilder.clientComponentEntryMap.has(
                  file,
                );
              }

              build.onEnd(async (result) => {
                let metafile = result.metafile;
                if (!metafile) {
                  throw new Error("Missing metafile");
                }

                let inputs = Object.keys(metafile.inputs)
                  .filter((input) => input.endsWith("error.tsx"))
                  .map((input) =>
                    path.isAbsolute(input) ? input : path.resolve(cwd, input),
                  );

                let errors = inputs.reduce<PartialMessage[]>(
                  (errors, input) => {
                    return input.match(errorsRegex) && !isClientComponent(input)
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
                  },
                  [],
                );

                return errors.length > 0 ? { errors } : null;
              });
            },
          },
        ],
      });

      this.#metafile = result?.metafile;

      // this.tree.tree.print();
    } catch (error) {
      console.error(error);
      this.reportError(error);
    }
  }

  async stop() {}

  serialize() {
    return {
      metafile: this.#metafile,
      serverActionMap: Object.fromEntries(
        this.#serverActionMap.entries().map((kv) => [kv[0], kv[1].serialize()]),
      ),
      imagesMap: Object.fromEntries(this.#imagesMap.entries()),
      fontsMap: Object.fromEntries(this.#fontsMap.entries()),
    };
  }

  load(data: any) {
    this.#metafile = data.metafile;
    this.#serverActionMap = new Map(
      Object.entries(data.serverActionMap).map((kv) => [
        kv[0],
        new CompiledServerAction(kv[1] as any),
      ]),
    );
    this.#imagesMap = new Map(Object.entries(data.imagesMap));
    this.#fontsMap = new Map(Object.entries(data.fontsMap));
    this.#cachedApplicationTree = undefined;
  }

  async warm() {
    let loadLayouts = this.#applicationTree.layouts.map((l) => l.preload());
    let loadPages = this.#applicationTree.pages.map((p) => p.preload());
    let loadNotFound = this.#applicationTree.notFoundPage.preload();
    let loadOuterRootWrapper = this.#applicationTree.outerRootWrapper.preload();
    let apiEndpoints = this.#applicationTree.apiEndpoints.map((api) =>
      api.preload(),
    );
    let errorTemplates = this.#applicationTree.errorTemplates.map(
      (errorTemplate) => errorTemplate.preload(),
    );
    let catchBoundaries = this.#applicationTree.catchBoundaries.map(
      (catchBoundary) => catchBoundary.preload(),
    );

    let loadServerActions = this.#serverActionMap
      .values()
      .map((a) => a.preload());

    let hasMiddleware = await this.hasMiddleware();
    let loadGlobalMiddleware = hasMiddleware
      ? import(pathToFileURL(this.middlewarePath).href)
      : Promise.resolve();

    let hasRootAuth = await this.hasRootAuth();
    let loadRootAuth = hasRootAuth
      ? import(pathToFileURL(this.rootAuthPath).href)
      : Promise.resolve();

    let loadRouteStackPlaceholder = import(
      pathToFileURL(this.routeStackPlaceholderPath).href
    );

    let promises = [
      ...loadLayouts,
      ...loadPages,
      ...errorTemplates,
      ...catchBoundaries,
      loadNotFound,
      loadOuterRootWrapper,
      ...apiEndpoints,
      ...loadServerActions,
      loadGlobalMiddleware,
      loadRootAuth,
      loadRouteStackPlaceholder,
    ];

    await Promise.all(promises);
  }

  get files() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    return Object.keys(metafile.outputs);
  }

  hasRootAuth() {
    return fileExists(srcPaths.app.rootAuth);
  }

  get rootAuthPath() {
    return this.compiledPathForEntry(srcPaths.app.rootAuth);
  }

  hasMiddleware() {
    return fileExists(srcPaths.app.globalMiddleware);
  }

  get middlewarePath() {
    return this.compiledPathForEntry(srcPaths.app.globalMiddleware);
  }

  private async notFoundTemplateSrcPath() {
    let hasCustomNotFound = await fileExists(srcPaths.app.notFound);
    return hasCustomNotFound
      ? srcPaths.app.notFound
      : srcPaths.framework.errorTemplates.notFound;
  }

  private async unauthorizedErrorTemplateSrcPath() {
    let hasCustomUnauthorized = await fileExists(srcPaths.app.unauthorized);
    return hasCustomUnauthorized
      ? srcPaths.app.unauthorized
      : srcPaths.framework.errorTemplates.unauthorized;
  }

  get pages() {
    return this.#applicationTree.pages;
  }

  get layouts() {
    return this.#applicationTree.layouts;
  }

  get apiEndpoints() {
    return this.#applicationTree.apiEndpoints;
  }

  private compiledPathForEntry(entryPath: string) {
    let metafile = this.#metafile;
    if (!metafile) {
      throw new Error("Could not find metafile");
    }

    let outputFilePath = getCompiledEntrypoint(entryPath, metafile);

    if (!outputFilePath) {
      throw new Error(`Could not find compiled path for entry ${entryPath}`);
    }

    return outputFilePath;
  }

  get routeStackPlaceholderPath() {
    return this.compiledPathForEntry(srcPaths.framework.routeStackPlaceholder);
  }

  private get routeStackPlaceholder() {
    let placeholderPath = this.routeStackPlaceholderPath;
    let placeholderUrl = pathToFileURL(placeholderPath);
    let placeholder = new Generic({ fileUrl: placeholderUrl });
    return placeholder;
  }

  get css() {
    let layoutCss = this.layouts.map((layout) => layout.css);
    let pageCss = this.pages.map((page) => page.css);

    let css = [...layoutCss, ...pageCss].filter((file) => file !== undefined);

    return css;
  }

  get root() {
    return this.#applicationTree.root;
  }

  #dumpNode(node: Node, indent: string = "") {
    console.log(indent + node.path);
    for (const child of node.children) {
      this.#dumpNode(child, indent + "  ");
    }
  }

  findPageForPath(path: string) {
    return this.root.tree.findPageForPath(path);
  }

  get serverManifest() {
    Object.fromEntries(this.#serverActionMap.entries());

    let keys = this.#serverActionMap.keys();
    return keys.reduce<
      Record<string, { id: string; name: string; chunks: string[] }>
    >((acc, key) => {
      let action = this.#serverActionMap.get(key);
      if (!action) {
        return acc;
      } else {
        return {
          ...acc,
          [action.id]: action.serverManifestEntry,
        };
      }
    }, {});
  }

  get serverActionModuleMap() {
    // moduleId -> {
    //   path: outputFile
    // }

    let keys = this.#serverActionMap.keys();
    return keys.reduce<Record<string, { path: string } | undefined>>(
      (acc, key) => {
        let action = this.#serverActionMap.get(key);
        if (!action) {
          return acc;
        } else {
          return {
            ...acc,
            [action.moduleId]: {
              path: action.filePath,
            },
          };
        }
      },
      {},
    );
  }
}

let appAppPath = fileURLToPath(appAppDir);
let frameworkSrcPath = fileURLToPath(frameworkSrcDir);
let srcPaths = {
  framework: {
    pages: {
      notFound: path.join(frameworkSrcPath, "client", "pages", "not-found.tsx"),
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
    rootAuth: path.join(appAppPath, "auth.ts"),
    globalMiddleware: path.join(appAppPath, "middleware.ts"),
    notFound: path.join(appAppPath, "pages", "errors", "not-found.tsx"),
    unauthorized: path.join(appAppPath, "pages", "unauthorized.error.tsx"),
  },
};
