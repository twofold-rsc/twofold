import { context } from "esbuild";
import { BuildContext, BuildMetafile } from "../build";
import { readFile, stat } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { appCompiledDir, appSrcDir, frameworkSrcDir } from "../files.js";
import * as postcssrc from "postcss-load-config";
import postcss from "postcss";
import "urlpattern-polyfill";
import { clientComponentProxyPlugin } from "./plugins/client-component-proxy-plugin.js";
import { serverActionsPlugin } from "./plugins/server-actions-plugin.js";
import { externalPackages } from "./externals.js";
import { getCompiledEntrypoint } from "./helpers/compiled-entrypoint.js";
import { EntriesBuilder } from "./entries-builder";
import path from "path";
import { Layout } from "./rsc/layout.js";
import { RSC } from "./rsc/rsc.js";
import { Page } from "./rsc/page.js";
import { Wrapper } from "./rsc/wrapper.js";

type CompiledAction = {
  id: string;
  path: string;
  export: string;
};

export class RSCBuilder {
  #context?: BuildContext;
  #metafile?: BuildMetafile;
  #error?: Error;
  #entriesBuilder: EntriesBuilder;
  #serverActionMap = new Map<string, CompiledAction>();

  constructor({ entriesBuilder }: { entriesBuilder: EntriesBuilder }) {
    this.#entriesBuilder = entriesBuilder;
  }

  get serverActionMap() {
    return this.#serverActionMap;
  }

  get entries() {
    return this.#entriesBuilder;
  }

  async build() {
    let builder = this;

    let hasMiddleware = await this.hasMiddleware();
    let middlewareEntry = hasMiddleware ? ["./src/middleware.ts"] : [];
    let serverActionModules = this.#entriesBuilder.serverActionModuleMap.keys();

    this.#context = await context({
      bundle: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints: [
        "./src/pages/**/*.page.tsx",
        "./src/pages/**/layout.tsx",
        ...middlewareEntry,
        ...serverActionModules,
        this.notFoundSrcPath,
        this.innerRootWrapperSrcPath,
      ],
      outdir: "./.twofold/rsc/",
      outbase: "src",
      entryNames: "[ext]/[dir]/[name]-[hash]",
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
            let storePath = fileURLToPath(
              new URL("../stores/rsc-store.js", import.meta.url),
            );
            build.onResolve({ filter: /\/stores\/rsc-store\.js$/ }, (args) => {
              if (args.importer.startsWith(frameworkSrcPath)) {
                return {
                  external: true,
                  path: storePath,
                };
              }
            });
          },
        },
      ],
    });

    this.#serverActionMap = new Map();
    this.#metafile = undefined;
    this.#error = undefined;

    try {
      let result = await this.#context?.rebuild();
      this.#metafile = result?.metafile;
    } catch (e: unknown) {
      console.log(e);

      if (e instanceof Error) {
        this.#error = e;
      } else {
        this.#error = new Error("Unknown error");
      }
    }
  }

  get error() {
    return this.#error;
  }

  get files() {
    let metafile = this.#metafile;

    if (!metafile) {
      return [];
    }

    return Object.keys(metafile.outputs);
  }

  async hasMiddleware() {
    let middlewareUrl = new URL("./middleware.ts", appSrcDir);
    try {
      let stats = await stat(middlewareUrl);
      return stats.isFile();
    } catch (e) {
      return false;
    }
  }

  get middlewarePath() {
    if (!this.#metafile) {
      throw new Error("No metafile");
    }

    let middlewareUrl = new URL("./middleware.ts", appSrcDir);
    let middlewarePath = fileURLToPath(middlewareUrl);

    return getCompiledEntrypoint(middlewarePath, this.#metafile);
  }

  get notFoundSrcPath() {
    return path.join(fileURLToPath(frameworkSrcDir), "pages", "not-found.tsx");
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

    // find not found in output
    let outputFile = getCompiledEntrypoint(this.notFoundSrcPath, metafile);

    let notFoundRsc = new RSC({
      path: "/**",
      fileUrl: pathToFileURL(outputFile),
    });

    let page = new Page({
      rsc: notFoundRsc,
    });
    let rootLayout = this.layouts.find((layout) => layout.rsc.path === "/");
    page.layout = rootLayout;

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

        // console.log("building page", path);
        // console.log("css", output.cssBundle);

        let rsc = new RSC({
          path,
          css: output.cssBundle
            ? output.cssBundle.replace(cssPrefix, "")
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
            ? output.cssBundle.replace(cssPrefix, "")
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
