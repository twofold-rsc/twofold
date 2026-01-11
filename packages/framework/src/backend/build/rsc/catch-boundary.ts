import { ErrorTemplate } from "./error-template.js";
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

  addChild(node: Node) {
    this.tree.addChild(node.tree);
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get errorTemplates() {
    return this.children.filter((c) => c instanceof ErrorTemplate);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  canAcceptAsChild(child: Node) {
    let alreadyHave;

    if (child.constructor === ErrorTemplate) {
      // if adding an error template lets add an additonal check that
      // makes sure we dont already have the tag
      alreadyHave = this.tree.children.some(
        (c) =>
          c.value.constructor === ErrorTemplate &&
          c.value.tag === child.tag &&
          c.value.path === child.path,
      );
    } else {
      alreadyHave = this.tree.children.some(
        (c) =>
          c.value.path === child.path &&
          c.value.constructor === child.constructor,
      );
    }

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
    //          taggedErrorComponents: [{
    //            tag: "unexpected",
    //            component: Component
    //          }]
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

    let errorTemplates = this.errorTemplates;

    let loadErrorComponents = errorTemplates.map(async (errorTemplate) => {
      let errorTemplateModule = await errorTemplate.loadModule();

      if (!errorTemplateModule.default) {
        throw new Error(
          `Error template for ${errorTemplate.path}/ has no default export.`,
        );
      }

      return {
        tag: errorTemplate.tag,
        component: errorTemplateModule.default,
      };
    });

    let taggedErrorComponents = await Promise.all(loadErrorComponents);

    return [
      // catchBoundary
      {
        func: catchBoundaryModule.default,
        requirements: [],
        props: {
          taggedErrorComponents,
          path: this.path,
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
