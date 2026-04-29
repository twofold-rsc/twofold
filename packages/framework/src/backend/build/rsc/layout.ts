import { type ModuleSurface } from "../../vite/router-types.js";
import { type Node, TreeNode, type Treeable } from "./tree-node.js";
import { Wrapper } from "./wrapper.js";

export class Layout implements Treeable {
  #path: string;
  #css?: string | undefined;
  #loadModule: () => Promise<ModuleSurface>;

  #wrappers: Wrapper[] = [];

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
    this.#loadModule = loadModule;
    this.#css = css;

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

  async loadRouteStackPlaceholder() {
    let module =
      await import("../../../client/components/route-stack/placeholder.js");
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

  /**
   * Gets a list of component functions and their requirements and
   * props for rendering.
   */
  async components(): Promise<
    { func: any; requirements: string[]; props: object }[]
  > {
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

    // wrappers
    let wrappers = await this.loadWrappers();

    // route stack placeholder
    let routeStackPlaceholder = await this.loadRouteStackPlaceholder();

    if (module.default) {
      let layout = {
        func: module.default,
        requirements: ["dynamicRequest"],
        props: {},
      };
    return [...wrappers, layout, routeStackPlaceholder];
    } else {
      return [...wrappers, routeStackPlaceholder];
    }
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
