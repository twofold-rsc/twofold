import { Layout } from "./layout.js";
import "urlpattern-polyfill";
import { Treeable, TreeNode } from "./tree-node.js";
import { CatchBoundary } from "./catch-boundary.js";
import { type ModuleSurface } from "../../vite/router.js";

export class Page implements Treeable {
  #path: string;
  #css?: string | undefined;
  #loadModule: () => Promise<ModuleSurface>;

  tree: TreeNode;

  constructor({
    path,
    css,
    loadModule,
  }: {
    path: string;
    css?: string | undefined;
    loadModule: () => Promise<ModuleSurface>;
  }) {
    this.#path = path;
    this.#css = css;
    this.#loadModule = loadModule;

    this.tree = new TreeNode(this);
  }

  canAcceptAsChild() {
    return false;
  }

  addChild() {
    throw new Error("Cannot add children to pages.");
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  // get layout() {
  //   let parent = this.parent;
  //   return parent instanceof Layout ? parent : undefined;
  // }
  //
  // set layout(layout: Layout | undefined) {
  //   this.tree.parent = layout ? layout.tree : null;
  // }

  get path() {
    return this.#path;
  }

  get css() {
    return this.#css;
  }

  get isDynamic() {
    return this.#path.includes("$");
  }

  get isCatchAll() {
    return this.#path.includes("$$");
  }

  get dynamicSegments() {
    return this.#path.match(/(?<!\$)\$([^/]+)/g) ?? [];
  }

  get catchAllSegments() {
    return this.#path.match(/\$\$([^/]+)/g) ?? [];
  }

  get pattern() {
    let pathname = this.#path
      .replace(/\/\(.*\)\//g, "/")
      .replace(/\/\$\$(\w+)/g, "/:$1(.*)")
      .replace(/\/\$/g, "/:");

    return new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname,
    });
  }

  get parents() {
    let parents = this.tree.parents.map((node) => node.value);
    return parents.reverse();
  }

  get layouts() {
    return this.parents.filter((p) => p instanceof Layout);
  }

  get assets() {
    let parentLayouts = this.parents.filter((p) => p instanceof Layout);
    return [...parentLayouts.map((layout) => layout.css), this.#css].filter(
      Boolean,
    );
  }

  async segments() {
    let loadParents = this.parents
      .filter(
        (parent) => parent instanceof Layout || parent instanceof CatchBoundary,
      )
      .map(async (parent) => {
        let components = await parent.components();
        return {
          path: parent.path,
          type:
            parent instanceof Layout
              ? "layout"
              : parent instanceof CatchBoundary
                ? "catch-boundary"
                : "unknown",
          components,
        };
      });

    let parentSegments = await Promise.all(loadParents);

    let components = await this.components();
    let pageSegment = {
      path: this.#path,
      type: "page",
      components,
    };

    return [...parentSegments, pageSegment];
  }

  private async components() {
    let module = await this.loadModule();
    if (!module.default) {
      throw new Error(`Page ${this.path} has no default export.`);
    }

    return [
      {
        func: module.default,
        requirements: ["dynamicRequest"],
        props: {},
      },
    ];
  }

  async runMiddleware(props: {
    params: Record<string, string | undefined>;
    searchParams: URLSearchParams;
    request: Request;
  }) {
    let module = await this.loadModule();
    if (module.before) {
      await module.before(props);
    }
  }

  private async loadModule() {
    return await this.#loadModule();
  }

  async preload() {
    await this.loadModule();
  }
}
