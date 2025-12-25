import {
  pathMatches,
  pathPartialMatches,
} from "../../runtime/helpers/routing.js";
import { partition } from "../../utils/partition.js";
import { CatchBoundary } from "./catch-boundary.js";
import { Generic } from "./generic.js";
import { Page } from "./page.js";
import { Node, TreeNode, Treeable } from "./tree-node.js";
import { Wrapper } from "./wrapper.js";

export class Layout implements Treeable {
  #path: string;
  #css?: string | undefined;
  #fileUrl: URL;

  #routeStackPlaceholder: Generic;
  #wrappers: Wrapper[] = [];

  tree: TreeNode;

  constructor({
    path,
    css,
    fileUrl,
    routeStackPlaceholder,
  }: {
    path: string;
    css?: string | undefined;
    fileUrl: URL;
    routeStackPlaceholder: Generic;
  }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
    this.#css = css;
    this.#routeStackPlaceholder = routeStackPlaceholder;

    this.tree = new TreeNode(this);
  }

  get path() {
    return this.#path;
  }

  get css() {
    return this.#css;
  }

  canAcceptAsChild(child: Node) {
    let alreadyHave = this.tree.children.some(
      (c) =>
        c.value.path === child.path &&
        c.value.constructor === child.constructor,
    );

    let isSame = child.path === this.path && child.constructor === Layout;
    let hasMatchingPath = child.path.startsWith(this.path);

    return !alreadyHave && !isSame && hasMatchingPath;
  }

  addChild(node: Node) {
    this.tree.addChild(node.tree);
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  addWrapper(wrapper: Wrapper) {
    this.#wrappers.push(wrapper);
  }

  async loadWrappers() {
    let loadWrapperModules = this.#wrappers.map(async (wrapper) => {
      let module = await wrapper.loadModule();
      if (!module.default) {
        throw new Error(`Wrapper for ${wrapper.path} has no default export.`);
      }

      // wrappers dont have any requirements or need for props today, but maybe
      // in the future they will.
      return {
        func: module.default,
        requirements: [],
        props: {},
      };
    });

    return Promise.all(loadWrapperModules);
  }

  // TODO: remove and inline
  async loadRouteStackPlaceholder() {
    let routeStackPlaceholder = this.#routeStackPlaceholder;
    let module = await routeStackPlaceholder.loadModule();
    if (!module.default) {
      throw new Error(
        `Route placeholder for ${this.#path} has no default export.`,
      );
    }

    return {
      func: module.default,
      requirements: [],
      props: {},
    };
  }

  // async loadCatchBoundary() {
  //   let catchBoundary = this.#catchBoundary;
  //   let module = await catchBoundary.loadModule();
  //   if (!module.default) {
  //     throw new Error(
  //       `Route placeholder for ${this.#path} has no default export.`,
  //     );
  //   }
  //
  //   return {
  //     func: module.default,
  //     requirements: [],
  //     props: {},
  //   };
  // }

  /**
   * Gets a list of component functions and their requirements and
   * props for rendering.
   */
  async components() {
    // flat list of all the components needed to render this layout.
    // it includes props as well as requirements.
    //
    // has this shape:
    //
    // -> [
    //      {
    //        func: Outer,
    //        requirements: [],
    //        props: {}
    //      },
    //      {
    //        func: Layout,
    //        requirements: ["dynamicRequest"],
    //        props: {}
    //      },
    //      {
    //        func: RouteStackPlaceholder,
    //        requirements: [],
    //        props: {}
    //      }
    //    ]

    let module = await this.loadModule();
    if (!module.default) {
      throw new Error(`Layout for ${this.path}/ has no default export.`);
    }

    let layout = {
      func: module.default,
      requirements: ["dynamicRequest"],
      props: {},
    };

    // wrappers
    let wrappers = await this.loadWrappers();

    // route stack placeholder
    let routeStackPlaceholder = await this.loadRouteStackPlaceholder();

    return [...wrappers, layout, routeStackPlaceholder];
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

// /**
//  * Can child go under parent
//  *
//  * @param child
//  * @param parent
//  * @returns
//  */
// function canGoUnder(child: Layout, parent: Layout) {
//   return false;
//   // let alreadyHave = parent.tree.children.some(
//   //   (current) => current.path === child.path,
//   // );
//   // let matchingPath =
//   //   child.path.startsWith(parent.path) && child.path !== parent.path;
//   //
//   // return !alreadyHave && matchingPath;
// }
