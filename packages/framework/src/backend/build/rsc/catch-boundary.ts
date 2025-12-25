import { Generic } from "./generic.js";
import { Layout } from "./layout.js";
import { Node, Treeable, TreeNode } from "./tree-node.js";

export class CatchBoundary implements Treeable {
  #path;
  #fileUrl: URL;
  #routeStackPlaceholder: Generic;

  tree: TreeNode;

  constructor({
    path,
    fileUrl,
    routeStackPlaceholder,
  }: {
    path: string;
    fileUrl: URL;
    routeStackPlaceholder: Generic;
  }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
    this.#routeStackPlaceholder = routeStackPlaceholder;

    this.tree = new TreeNode(this);
  }

  get path() {
    return this.#path;
  }

  addChild() {
    throw new Error("No impl");
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  canAcceptAsChild(child: Node) {
    let alreadyHave = this.tree.children.some(
      (c) =>
        c.value.path === child.path &&
        c.value.constructor === child.constructor,
    );

    let isCatchBoundaryForLayout =
      child instanceof Layout && child.path === this.path;

    let isSame =
      child.path === this.path && child.constructor === CatchBoundary;
    let hasMatchingPath = child.path.startsWith(this.path);

    return (
      !isCatchBoundaryForLayout && !alreadyHave && !isSame && hasMatchingPath
    );
  }

  async components() {
    // flat list of all the components needed to render this catch boundary.
    // it includes props as well as requirements.
    //
    // has this shape:
    //
    // -> [
    //      {
    //        func: CatchBoundary,
    //        requirements: [],
    //        props: {
    //          // TODO: list of error templates and tags
    //        }
    //      },
    //      {
    //        func: RouteStackPlaceholder,
    //        requirements: [],
    //        props: {}
    //      }
    //    ]

    let catchBoundaryModule = await this.loadModule();
    if (!catchBoundaryModule.default) {
      throw new Error(`CatchBoundary for ${this.path}/ has no default export.`);
    }

    let routeStackPlaceholder = this.#routeStackPlaceholder;
    let routeStackPlaceholderModule = await routeStackPlaceholder.loadModule();
    if (!routeStackPlaceholderModule.default) {
      throw new Error(
        `Route placeholder for ${this.#path}/ has no default export.`,
      );
    }

    return [
      // catchBoundary
      {
        func: catchBoundaryModule.default,
        requirements: [],
        props: {
          // TODO: templates
        },
      },
      {
        func: routeStackPlaceholderModule.default,
        requirements: [],
        props: {},
      },
    ];
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }
}
