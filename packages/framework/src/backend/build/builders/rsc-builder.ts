import { Metafile, build } from "esbuild";
import { readFile } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import {
  appCompiledDir,
  appSrcDir,
  frameworkCompiledDir,
  frameworkSrcDir,
} from "../../files.js";
import * as postcssrc from "postcss-load-config";
import postcss from "postcss";
import { clientComponentProxyPlugin } from "../plugins/client-component-proxy-plugin.js";
import { serverActionsPlugin } from "../plugins/server-actions-plugin.js";
import { externalPackages } from "../externals.js";
import { getCompiledEntrypoint } from "../helpers/compiled-entrypoint.js";
import { EntriesBuilder } from "./entries-builder";
import path from "path";
import { Layout } from "../rsc/layout.js";
import { RSC } from "../rsc/rsc.js";
import { Page } from "../rsc/page.js";
import { Wrapper } from "../rsc/wrapper.js";
import { fileExists } from "../helpers/file.js";
import { Builder } from "./base-builder.js";

type CompiledAction = {
  id: string;
  path: string;
  export: string;
};

export class RSCBuilder extends Builder {
  readonly name = "rsc";

  #metafile?: Metafile;
  #entriesBuilder: EntriesBuilder;
  #serverActionMap = new Map<string, CompiledAction>();

  constructor({ entriesBuilder }: { entriesBuilder: EntriesBuilder }) {
    super();
    this.#entriesBuilder = entriesBuilder;
  }

  get serverActionMap() {
    return this.#serverActionMap;
  }

  get entries() {
    return this.#entriesBuilder;
  }

  async setup() {}

  async build() {
    let builder = this;

    let hasMiddleware = await this.hasMiddleware();
    let middlewareEntry = hasMiddleware ? ["./src/middleware.ts"] : [];

    let notFoundEntry = await this.notFoundSrcPath();

    let serverActionModules = this.#entriesBuilder.serverActionModuleMap.keys();
    let serverActionEntries = this.#entriesBuilder.serverActionEntryMap.keys();

    this.#serverActionMap = new Map();
    this.#metafile = undefined;
    this.clearError();

    try {
      let result = await build({
        bundle: true,
        format: "esm",
        jsx: "automatic",
        logLevel: "error",
        entryPoints: [
          "./src/pages/**/*.page.tsx",
          "./src/pages/**/layout.tsx",
          ...middlewareEntry,
          ...serverActionModules,
          ...serverActionEntries,
          notFoundEntry,
          this.innerRootWrapperSrcPath,
        ],
        outdir: "./.twofold/rsc/",
        outbase: "src",
        entryNames: "[ext]/[name]-[hash]",
        external: ["react", "react-server-dom-webpack", ...externalPackages],
        conditions: ["react-server", "module"],
        platform: "node",
        splitting: true,
        chunkNames: "chunks/[name]-[hash]",
        metafile: true,
        plugins: [
          clientComponentProxyPlugin({ builder: builder }),
          serverActionsPlugin({ builder: builder }),
          {
            name: "postcss",
            async setup(build) {
              let postcssConfig: postcssrc.Result | false;

              // this becomes root when we point at an actual app
              // @ts-ignore
              postcssConfig = await postcssrc.default();
              build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
                let css = await readFile(path, "utf8");

                if (!postcssConfig) {
                  return { contents: css, loader: "css" };
                }

                let result = await postcss(postcssConfig.plugins).process(css, {
                  ...postcssConfig.options,
                  from: path,
                });

                return {
                  contents: result.css,
                  loader: "css",
                };
              });
            },
          },
          {
            name: "stores",
            setup(build) {
              let frameworkSrcPath = fileURLToPath(frameworkSrcDir);
              let storeUrl = new URL(
                "./backend/stores/rsc-store.js",
                frameworkCompiledDir,
              );

              build.onResolve(
                { filter: /\/stores\/rsc-store\.js$/ },
                (args) => {
                  if (args.importer.startsWith(frameworkSrcPath)) {
                    return {
                      external: true,
                      path: storeUrl.href,
                    };
                  }
                },
              );
            },
          },
        ],
      });

      this.#metafile = result?.metafile;
    } catch (error) {
      console.error(error);
      this.reportError(error);
    }
  }

  async stop() {}

  serialize() {
    return {
      metafile: this.#metafile,
      serverActionMap: Object.fromEntries(this.#serverActionMap.entries()),
    };
  }

  load(data: any) {
    this.#metafile = data.metafile;
    this.#serverActionMap = new Map(Object.entries(data.serverActionMap));
  }

  get files() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    return Object.keys(metafile.outputs);
  }

  hasMiddleware() {
    return fileExists(new URL("./middleware.ts", appSrcDir));
  }

  get middlewarePath() {
    if (!this.#metafile) {
      throw new Error("No metafile");
    }

    let middlewareUrl = new URL("./middleware.ts", appSrcDir);
    let middlewarePath = fileURLToPath(middlewareUrl);

    return getCompiledEntrypoint(middlewarePath, this.#metafile);
  }

  private async notFoundSrcPath() {
    let hasCustomNotFound = await fileExists(srcPaths.app.notFound);
    return hasCustomNotFound
      ? srcPaths.app.notFound
      : srcPaths.framework.notFound;
  }

  get innerRootWrapperSrcPath() {
    return path.join(
      fileURLToPath(frameworkSrcDir),
      "components",
      "inner-root-wrapper.tsx",
    );
  }

  get notFoundPage() {
    let metafile = this.#metafile;

    if (!metafile) {
      throw new Error("Could not find not-found page");
    }

    let page = this.tree.findPage(
      (p) => p.pattern.pathname === "/errors/not-found",
    );

    if (!page) {
      let entryPoint = srcPaths.framework.notFound;
      let outputFile = getCompiledEntrypoint(entryPoint, metafile);

      let notFoundRsc = new RSC({
        path: "/errors/not-found",
        fileUrl: pathToFileURL(outputFile),
      });

      let rootLayout = this.layouts.find((layout) => layout.rsc.path === "/");
      page = new Page({
        rsc: notFoundRsc,
      });
      page.layout = rootLayout;
    }

    return page;
  }

  get pages() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "src/pages/";
    let pageSuffix = ".page.tsx";

    let cssUrl = new URL("./rsc/css/", appCompiledDir);
    let cssPath = fileURLToPath(cssUrl);
    let cssPrefix = cssPath.slice(process.cwd().length + 1);

    let keys = Object.keys(outputs);
    return keys
      .filter((key) => {
        let entryPoint = outputs[key].entryPoint;
        return entryPoint && entryPoint.endsWith(pageSuffix);
      })
      .map((key) => {
        let output = outputs[key];
        let entryPoint = outputs[key].entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let path = entryPoint.slice(prefix.length).slice(0, -pageSuffix.length);
        if (path === "index" || path.endsWith("/index")) {
          path = path.slice(0, -6);
        }
        path = `/${path}`;

        let rsc = new RSC({
          path,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
        });

        return new Page({
          rsc,
        });
      });
  }

  get layouts() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    let outputs = metafile.outputs;
    let cwd = process.cwd();
    let baseUrl = pathToFileURL(`${cwd}/`);
    let prefix = "src/pages/";
    let layoutSuffix = "/layout.tsx";

    let cssUrl = new URL("./rsc/css/", appCompiledDir);
    let cssPath = fileURLToPath(cssUrl);
    let cssPrefix = cssPath.slice(process.cwd().length + 1);

    let keys = Object.keys(outputs);

    return keys
      .filter((key) => {
        let entryPoint = outputs[key].entryPoint;
        return entryPoint && entryPoint.endsWith(layoutSuffix);
      })
      .map((key) => {
        let output = outputs[key];
        let entryPoint = output.entryPoint;

        if (!entryPoint) {
          throw new Error("No entry point");
        }

        let path = entryPoint
          .slice(prefix.length)
          .slice(0, -layoutSuffix.length);

        let rsc = new RSC({
          path: `/${path}`,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
        });

        return new Layout({ rsc });
      });
  }

  get innerRootWrapper() {
    let metafile = this.#metafile;

    if (!metafile) {
      throw new Error("Could not find inner root wrapper");
    }

    let outputFilePath = getCompiledEntrypoint(
      this.innerRootWrapperSrcPath,
      metafile,
    );
    let outputFileUrl = pathToFileURL(outputFilePath);

    let rsc = new RSC({
      path: "/",
      fileUrl: outputFileUrl,
    });

    let wrapper = new Wrapper({ rsc });

    return wrapper;
  }

  get css() {
    let layoutCss = this.layouts.map((layout) => layout.rsc.css);
    let pageCss = this.pages.map((page) => page.rsc.css);

    let css = [...layoutCss, ...pageCss].filter(Boolean);

    return css;
  }

  get tree() {
    let pages = this.pages;
    let layouts = this.layouts;
    let innerRootWrapper = this.innerRootWrapper;

    let root = layouts.find((layout) => layout.rsc.path === "/");
    let otherLayouts = layouts.filter((layout) => layout.rsc.path !== "/");

    if (!root) {
      throw new Error("No root layout");
    }

    otherLayouts.forEach((layout) => root?.add(layout));
    pages.forEach((page) => root?.add(page));

    root.addWrapper(innerRootWrapper);

    return root;
  }
}

let appSrcPath = fileURLToPath(appSrcDir);
let frameworkSrcPath = fileURLToPath(frameworkSrcDir);
let srcPaths = {
  framework: {
    notFound: path.join(frameworkSrcPath, "pages", "not-found.tsx"),
  },
  app: {
    notFound: path.join(appSrcPath, "pages", "errors", "not-found.tsx"),
  },
};
