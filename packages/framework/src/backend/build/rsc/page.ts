import { Layout } from "./layout.js";
import "urlpattern-polyfill";
import { Treeable, TreeNode } from "./tree-node.js";
import { CatchBoundary } from "./catch-boundary.js";

export class Page implements Treeable {
  #path: string;
  #css?: string | undefined;
  #fileUrl: URL;

  tree: TreeNode;

  constructor({
    path,
    css,
    fileUrl,
  }: {
    path: string;
    css?: string | undefined;
    fileUrl: URL;
  }) {
    this.#path = path;
    this.#css = css;
    this.#fileUrl = fileUrl;

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
          components,
        };
      });

    let parentSegments = await Promise.all(loadParents);

    let components = await this.components();
    let pageSegment = {
      path: this.#path,
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
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }
}
