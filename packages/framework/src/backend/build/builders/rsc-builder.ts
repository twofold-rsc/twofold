import { Metafile, build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "url";
import {
  appCompiledDir,
  appAppDir,
  frameworkCompiledDir,
  frameworkSrcDir,
} from "../../files.js";
import { clientComponentProxyPlugin } from "../plugins/client-component-proxy-plugin.js";
import { serverActionsPlugin } from "../plugins/server-actions-plugin.js";
import { externalPackages } from "../packages.js";
import { getCompiledEntrypoint } from "../helpers/compiled-entrypoint.js";
import { EntriesBuilder } from "./entries-builder.js";
import path from "path";
import { Page } from "../rsc/page.js";
import { Wrapper } from "../rsc/wrapper.js";
import { fileExists } from "../helpers/file.js";
import { Builder } from "./builder.js";
import { Build } from "../build/build.js";
import { Layout } from "../rsc/layout.js";
import { API } from "../rsc/api.js";
import { tailwindPlugin } from "../plugins/tailwind-plugin.js";

type CompiledAction = {
  id: string;
  path: string;
  export: string;
};

export class RSCBuilder extends Builder {
  readonly name = "rsc";

  #metafile?: Metafile;
  #entriesBuilder: EntriesBuilder;
  #build: Build;
  #serverActionMap = new Map<string, CompiledAction>();

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

  get entries() {
    return this.#entriesBuilder;
  }

  async setup() {}

  async build() {
    let builder = this;

    let hasMiddleware = await this.hasMiddleware();
    let middlewareEntry = hasMiddleware ? ["./app/middleware.ts"] : [];

    let notFoundEntry = await this.notFoundSrcPath();

    // files need to be sorted for deterministic builds
    let serverActionEntries = Array.from(
      this.#entriesBuilder.serverActionEntryMap.keys(),
    ).sort();

    this.#serverActionMap = new Map();
    this.#metafile = undefined;
    this.clearError();

    try {
      let appConfig = await this.#build.getAppConfig();
      let userDefinedExternalPackages = appConfig.externalPackages;
      let discoveredExternals = this.#entriesBuilder.discoveredExternals;

      let result = await build({
        bundle: true,
        format: "esm",
        jsx: "automatic",
        logLevel: "error",
        entryPoints: [
          "./app/pages/**/*.page.tsx",
          "./app/pages/**/layout.tsx",
          "./app/pages/**/*.api.ts",
          "./app/pages/**/*.api.tsx",
          ...middlewareEntry,
          ...serverActionEntries,
          notFoundEntry,
          this.innerRootWrapperSrcPath,
        ],
        outdir: "./.twofold/rsc/",
        outbase: "app",
        entryNames: "[ext]/[name]-[hash]",
        external: [
          ...externalPackages,
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
          tailwindPlugin({ base: fileURLToPath(appAppDir) }),
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
    return fileExists(new URL("./middleware.ts", appAppDir));
  }

  get middlewarePath() {
    if (!this.#metafile) {
      throw new Error("No metafile");
    }

    let middlewareUrl = new URL("./middleware.ts", appAppDir);
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
      "client",
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
      let rootLayout = this.layouts.find((layout) => layout.path === "/");

      page = new Page({
        path: "/errors/not-found",
        fileUrl: pathToFileURL(outputFile),
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
    let prefix = "app/pages/";
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

        return new Page({
          path,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
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
    let prefix = "app/pages/";
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

        return new Layout({
          path: `/${path}`,
          css: output.cssBundle
            ? output.cssBundle.slice(cssPrefix.length)
            : undefined,
          fileUrl: new URL(key, baseUrl),
        });
      });
  }

  get apiEndpoints() {
    let metafile = this.#metafile;

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
        let entryPoint = outputs[key].entryPoint;
        return entryPoint && apiSuffix.test(entryPoint);
      })
      .map((key) => {
        let entryPoint = outputs[key].entryPoint;

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

    let wrapper = new Wrapper({
      path: "/",
      fileUrl: outputFileUrl,
    });

    return wrapper;
  }

  get css() {
    let layoutCss = this.layouts.map((layout) => layout.css);
    let pageCss = this.pages.map((page) => page.css);

    let css = [...layoutCss, ...pageCss].filter(Boolean);

    return css;
  }

  get tree() {
    let pages = this.pages;
    let layouts = this.layouts;
    let innerRootWrapper = this.innerRootWrapper;

    let root = layouts.find((layout) => layout.path === "/");
    let otherLayouts = layouts.filter((layout) => layout.path !== "/");

    if (!root) {
      throw new Error("No root layout");
    }

    otherLayouts.forEach((layout) => root?.add(layout));
    pages.forEach((page) => root?.add(page));

    root.addWrapper(innerRootWrapper);

    return root;
  }
}

let appAppPath = fileURLToPath(appAppDir);
let frameworkSrcPath = fileURLToPath(frameworkSrcDir);
let srcPaths = {
  framework: {
    notFound: path.join(frameworkSrcPath, "client", "pages", "not-found.tsx"),
  },
  app: {
    notFound: path.join(appAppPath, "pages", "errors", "not-found.tsx"),
  },
};
