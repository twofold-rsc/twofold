import { context } from "esbuild";
import { BuildContext, BuildMetafile } from "../build";
import { readFile, stat } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { appCompiledDir, appSrcDir, frameworkSrcDir } from "../files.js";
import * as postcssrc from "postcss-load-config";
import postcss from "postcss";
import "urlpattern-polyfill";
import { componentsToTree } from "../render.js";
import { clientComponentProxyPlugin } from "./plugins/client-component-proxy-plugin.js";
import { serverActionsPlugin } from "./plugins/server-actions.js";
import { externalPackages } from "./externals.js";
import { getCompiledEntrypoint } from "./helpers/compiled-entrypoint.js";

type ClientComponent = {
  moduleId: string;
  path: string;
  exports: string[];
};

type CompiledAction = {
  id: string;
  path: string;
  export: string;
};

export class RSCBuilder {
  #context?: BuildContext;
  #metafile?: BuildMetafile;
  #error?: Error;
  #clientComponents = new Set<ClientComponent>();
  #serverActionMap = new Map<string, CompiledAction>();

  get clientComponents() {
    return this.#clientComponents;
  }

  get serverActionMap() {
    return this.#serverActionMap;
  }

  async setup() {
    let builder = this;

    let hasMiddleware = await this.hasMiddleware();

    let entryPoints = [
      "./src/pages/**/*.page.tsx",
      "./src/pages/**/layout.tsx",
    ];

    if (hasMiddleware) {
      entryPoints.push("./src/middleware.ts");
    }

    this.#context = await context({
      bundle: true,
      format: "esm",
      jsx: "automatic",
      logLevel: "error",
      entryPoints,
      outdir: "./.twofold/rsc/",
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

            // let path = fixtureDir.pathname;

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
          name: "store",
          setup(build) {
            let srcPath = fileURLToPath(frameworkSrcDir);
            let storePath = fileURLToPath(
              new URL("../store.js", import.meta.url),
            );
            build.onResolve({ filter: /backend\/store\.js$/ }, (args) => {
              if (args.importer.startsWith(srcPath)) {
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
  }

  async build() {
    this.#clientComponents = new Set();
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

        return new Page({ rsc });
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

  get css() {
    let layoutCss = this.layouts.map((layout) => layout.rsc.css);
    let pageCss = this.pages.map((page) => page.rsc.css);

    let css = [...layoutCss, ...pageCss].filter(Boolean);

    return css;
  }

  get tree() {
    let pages = this.pages;
    let layouts = this.layouts;

    let root = layouts.find((layout) => layout.rsc.path === "/");
    let otherLayouts = layouts.filter((layout) => layout.rsc.path !== "/");

    if (!root) {
      throw new Error("No root layout");
    }

    otherLayouts.forEach((layout) => root?.add(layout));
    pages.forEach((page) => root?.add(page));

    return root;
  }

  isAction(id: string) {
    return this.#serverActionMap.has(id);
  }

  async runAction(id: string, args: any[]) {
    let action = this.#serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    let module = await import(action.path);
    let fn = module[action.export];

    return fn.apply(null, args);
  }
}

class RSC {
  path: string;
  css?: string;
  fileUrl: URL;

  constructor({
    path,
    css,
    fileUrl,
  }: {
    path: string;
    css?: string;
    fileUrl: URL;
  }) {
    this.path = path;
    this.fileUrl = fileUrl;
    this.css = css;
  }

  async runMiddleware(request: Request) {
    let module = await this.loadModule();
    if (module.before) {
      module.before(request);
    }
  }

  async loadModule() {
    let module = await import(this.fileUrl.href);
    return module;
  }
}

class Layout {
  #rsc: RSC;
  #children: Layout[] = [];
  #parent?: Layout;
  #pages: Page[] = [];

  constructor({ rsc }: { rsc: RSC }) {
    this.#rsc = rsc;
  }

  get rsc() {
    return this.#rsc;
  }

  get children() {
    return this.#children;
  }

  set parent(parent: Layout | undefined) {
    this.#parent = parent;
  }

  get parent() {
    return this.#parent;
  }

  add(child: Layout | Page) {
    if (child instanceof Layout) {
      this.addLayout(child);
    } else if (child instanceof Page) {
      this.addPage(child);
    }
  }

  findPage(f: (page: Page) => boolean): Page | undefined {
    let page =
      this.#pages.find(f) ||
      this.#children.map((child) => child.findPage(f)).find(Boolean);

    return page;
  }

  print() {
    let indent = 0;

    console.log("*** Printing Tree ***");

    let print = (layout: Layout) => {
      console.log(`${" ".repeat(indent)} ${layout.rsc.path} (layout)`);
      indent++;
      layout.#pages.map((page) => {
        console.log(`${" ".repeat(indent)} ${page.rsc.path} (page)`);
      });
      layout.children.forEach(print);
      indent--;
    };

    print(this);

    console.log("*** Done Printing Tree ***");
  }

  private addLayout(layout: Layout) {
    // can it go under a child of mine?
    let child = this.#children.find((possibleParent) =>
      canGoUnder(layout, possibleParent),
    );

    if (child) {
      child.addLayout(layout);
    } else if (canGoUnder(layout, this)) {
      // re-balance my children
      let [move, keep] = partition(this.#children, (child) =>
        canGoUnder(layout, child),
      );
      this.#children = keep;

      // move the matching children to the new layout
      move.forEach((child) => layout.addLayout(child));

      // add to my children
      this.#children.push(layout);
      layout.parent = this;

      // readd all my pages?
      let pages = this.#pages;
      this.#pages = [];
      pages.forEach((page) => this.addPage(page));
    } else {
      // cant go under a child, cant go under me
      throw new Error(
        `Could not add layout ${layout.rsc.path} to ${this.rsc.path}`,
      );
    }
  }

  private addPage(page: Page) {
    let isMatch = page.rsc.path.startsWith(this.rsc.path);
    let matchingChild = this.#children.find((child) =>
      page.rsc.path.startsWith(child.rsc.path),
    );

    if (matchingChild) {
      matchingChild.addPage(page);
    } else if (isMatch) {
      this.#pages.push(page);
      page.layout = this;
    } else {
      throw new Error(
        `Could not add page ${page.rsc.path} to ${this.rsc.path}`,
      );
    }
  }
}

function canGoUnder(child: Layout, parent: Layout) {
  let alreadyHave = parent.children.some(
    (current) => current.rsc.path === child.rsc.path,
  );
  let matchingPath =
    child.rsc.path.startsWith(parent.rsc.path) &&
    child.rsc.path !== parent.rsc.path;

  return !alreadyHave && matchingPath;
}

function partition<T>(arr: T[], condition: (item: T) => boolean) {
  return arr.reduce<[T[], T[]]>(
    (acc, item) => {
      if (condition(item)) {
        acc[0].push(item);
      } else {
        acc[1].push(item);
      }
      return acc;
    },
    [[], []],
  );
}

class Page {
  #rsc: RSC;
  #layout?: Layout;

  constructor({ rsc }: { rsc: RSC }) {
    this.#rsc = rsc;
  }

  get isDynamic() {
    return this.#rsc.path.includes("$");
  }

  get pattern() {
    return new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: this.#rsc.path.replace(/\/\$/g, "/:"),
    });
  }

  get rsc() {
    return this.#rsc;
  }

  set layout(layout: Layout | undefined) {
    this.#layout = layout;
  }

  get layout() {
    return this.#layout;
  }

  private get layouts() {
    let layouts = [];
    let layout = this.#layout;

    while (layout) {
      layouts.push(layout);
      layout = layout.parent;
    }

    return layouts.reverse();
  }

  async runMiddleware(request: Request) {
    let promises = [
      this.#rsc.runMiddleware(request),
      ...this.layouts.map((layout) => layout.rsc.runMiddleware(request)),
    ];

    await Promise.all(promises);
  }

  get assets() {
    return [
      ...this.layouts.map((layout) => layout.rsc.css),
      this.#rsc.css,
    ].filter(Boolean);
  }

  async reactTree(request: Request) {
    let url = new URL(request.url);
    let execPattern = this.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;
    let { page, layouts } = await this.components();

    let tree = componentsToTree({
      components: [...layouts, page],
      props: { params, searchParams, request },
    });

    return tree;
  }

  private async components() {
    let loadLayoutModules = this.layouts.map(async (layout) => {
      let module = await layout.rsc.loadModule();
      if (!module.default) {
        throw new Error(
          `Layout for ${layout.rsc.path}/ has no default export.`,
        );
      }
      return module.default;
    });

    let layouts = await Promise.all(loadLayoutModules);
    let module = await this.#rsc.loadModule();

    if (!module.default) {
      throw new Error(`Page ${this.rsc.path} has no default export.`);
    }

    return {
      page: module.default,
      layouts: layouts,
    };
  }
}
