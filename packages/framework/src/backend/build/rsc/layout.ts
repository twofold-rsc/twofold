import {
  pathMatches,
  pathPartialMatches,
} from "../../runtime/helpers/routing.js";
import { partition } from "../../utils/partition.js";
import { ErrorWrapper } from "./error-template.js";
import { Generic } from "./generic.js";
import { Page } from "./page.js";
import { Node, TreeNode, Treeable } from "./tree-node.js";
import { Wrapper } from "./wrapper.js";

export class Layout implements Treeable {
  #path: string;
  #css?: string | undefined;
  #fileUrl: URL;

  // #children: (Layout | Page)[] = [];
  // #parent?: Layout | undefined;
  // #pages: Page[] = [];
  #routeStackPlaceholder: Generic;
  // #catchBoundary: Generic;
  // #errorWrappers: ErrorWrapper[] = [];
  #wrappers: Wrapper[] = [];

  tree: TreeNode;

  constructor({
    path,
    css,
    fileUrl,
    routeStackPlaceholder,
    // catchBoundary,
  }: {
    path: string;
    css?: string | undefined;
    fileUrl: URL;
    routeStackPlaceholder: Generic;
    // catchBoundary: Generic;
  }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
    this.#css = css;
    this.#routeStackPlaceholder = routeStackPlaceholder;
    // this.#catchBoundary = catchBoundary;

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

  // addChild(node: Layout) {
  //   this.tree.addChild(this, node);
  // }
  //
  // detach() {
  //   this.tree.detach(this);
  // }

  // get parent() {
  //   return this.tree.parent;
  // }

  // set parent(parent: Layout | null) {
  //   this.tree.setParent(this, parent);
  // }

  // get children() {
  //   return this.tree.children;
  // }

  // get children() {
  //   return this.#children;
  // }

  private get pages() {
    return this.children.filter((c) => c instanceof Page);
  }

  private get childLayouts() {
    return this.children.filter((c) => c instanceof Layout);
  }

  // set parent(parent: Layout | undefined) {
  //   this.#parent = parent;
  // }
  //
  // get parent() {
  //   return this.#parent;
  // }

  // add(child: Layout | Page | ErrorWrapper) {
  //   if (child instanceof Layout) {
  //     this.addLayout(child);
  //   } else if (child instanceof Page) {
  //     this.addPage(child);
  //   }
  //   // } else if (child instanceof ErrorWrapper) {
  //   //   this.addErrorWrapper(child);
  //   // }
  // }

  findPageForPath(realPath: string): Page | undefined {
    let [staticAndDynamicPages, catchAllPages] = partition(
      this.pages,
      (page) => !page.isCatchAll,
    );
    let [dynamicPages, staticPages] = partition(
      staticAndDynamicPages,
      (page) => page.isDynamic,
    );

    let sortBy = (a: Page, b: Page) =>
      a.dynamicSegments.length - b.dynamicSegments.length;
    let dynamicPagesInOrder = dynamicPages.toSorted(sortBy);

    let page =
      staticPages.find((page) => pathMatches(page.path, realPath)) ??
      dynamicPagesInOrder.find((page) => pathMatches(page.path, realPath)) ??
      this.childLayouts
        .filter((child) => pathPartialMatches(child.path, realPath))
        .map((child) => child.findPageForPath(realPath))
        .find(Boolean) ??
      catchAllPages.find((page) => pathMatches(page.path, realPath));

    return page;
  }

  print() {
    let indent = 0;

    console.log("*** Printing Tree ***");

    let print = (layout: Layout) => {
      console.log(`${" ".repeat(indent)} ${layout.path} (layout)`);
      indent++;
      // TODO: remove
      // layout.#errorWrappers.map((errorWrapper) => {
      //   console.log(`${" ".repeat(indent)} ${errorWrapper.path} (error)`);
      // });
      layout.pages.map((page) => {
        console.log(`${" ".repeat(indent)} ${page.path} (page)`);
      });
      layout.childLayouts.forEach(print);
      indent--;
    };

    print(this);

    console.log("*** Done Printing Tree ***");
  }

  // private addLayout(layout: Layout) {
  //   let childLayouts = this.childLayouts;
  //
  //   // can it go under a child of mine?
  //   let child = childLayouts.find((possibleParent) =>
  //     canGoUnder(layout, possibleParent),
  //   );
  //
  //   if (child) {
  //     child.addLayout(layout);
  //   } else if (canGoUnder(layout, this)) {
  //     // re-balance my children
  //     let [move, keep] = partition(childLayouts, (child) =>
  //       canGoUnder(child, layout),
  //     );
  //     this.#children = keep;
  //
  //     // move the matching children to the new layout
  //     move.forEach((child) => layout.addLayout(child));
  //
  //     // add to my children
  //     this.#children.push(layout);
  //     // layout.tree.parent = this;
  //
  //     // TODO: needs proper balancing here
  //     // readd all my pages?
  //     let pages = this.pages;
  //     this.#children = this.#children.filter((c) => !(c instanceof Page));
  //     pages.forEach((page) => this.addPage(page));
  //   } else {
  //     // cant go under a child, cant go under me
  //     throw new Error(`Could not add layout ${layout.path} to ${this.path}`);
  //   }
  // }

  // private addPage(page: Page) {
  //   let isMatch = page.path.startsWith(this.path);
  //   let matchingChild = this.childLayouts.find((child) =>
  //     page.path.startsWith(child.path),
  //   );
  //
  //   if (matchingChild) {
  //     matchingChild.addPage(page);
  //   } else if (isMatch) {
  //     this.#children.push(page);
  //     page.parent = this;
  //   } else {
  //     throw new Error(`Could not add page ${page.path} to ${this.path}`);
  //   }
  // }

  // private addErrorWrapper(errorWrapper: ErrorWrapper) {
  //   let isMatch = errorWrapper.path.startsWith(this.path);
  //   let matchingChild = this.#children.find((child) =>
  //     errorWrapper.path.startsWith(child.path),
  //   );
  //
  //   if (matchingChild) {
  //     matchingChild.addErrorWrapper(errorWrapper);
  //   } else if (isMatch) {
  //     this.#errorWrappers.push(errorWrapper);
  //   } else {
  //     throw new Error(
  //       `Could not add error page ${errorWrapper.path} to ${this.path}`,
  //     );
  //   }
  // }

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

    // TODO: load crash CatchBoundary w/ errors

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
