import {
  pathMatches,
  pathPartialMatches,
} from "../../runtime/helpers/routing.js";
import { partition } from "../../utils/partition.js";
import { CatchBoundary } from "./catch-boundary.js";
import { ErrorTemplate } from "./error-template.js";
import { Layout } from "./layout.js";
import { Page } from "./page.js";

export type Node = Layout | CatchBoundary | Page | ErrorTemplate;

export type Treeable = {
  tree: TreeNode;
  canAcceptAsChild(other: Node): boolean;

  addChild: (node: Node) => void;

  path: string;

  children: Node[];
  parent: Node | undefined;
};

export class TreeNode {
  #value: Node;
  #parent: TreeNode | null = null;
  #children: TreeNode[] = [];

  constructor(value: Node) {
    this.#value = value;
  }

  get children() {
    return this.#children;
  }

  set children(children: TreeNode[]) {
    this.#children = children;
  }

  get parent() {
    return this.#parent;
  }

  get value() {
    return this.#value;
  }

  set parent(parent: TreeNode | null) {
    if (parent === null) {
      this.detach();
    } else {
      parent.addChild(this);
    }
  }

  get parents() {
    let parents = [];
    let p = this.#parent;
    while (p) {
      parents.push(p);
      p = p.#parent;
    }
    return parents;
  }

  detach() {
    if (this.#parent) {
      this.#parent.children = this.#parent.children.filter((c) => c !== this);
      this.#parent = null;
    }
  }

  #isAncestorOf(node: TreeNode) {
    let p = this.#parent;
    while (p) {
      if (p === node) {
        return true;
      }
      p = p.#parent;
    }
    return false;
  }

  addChild(node: TreeNode) {
    if (this === node) {
      throw new Error("A tree node cannot be its own child.");
    }

    if (this.#isAncestorOf(node)) {
      throw new Error("Cannot move a node under its own descendant.");
    }

    let addToChild = this.children.find((child) =>
      child.#value.canAcceptAsChild(node.#value),
    );

    if (addToChild) {
      addToChild.addChild(node);
      this.#rebalanceChildrenAgainst(addToChild);
    } else if (this.#value.canAcceptAsChild(node.#value)) {
      node.detach();
      node.#parent = this;
      this.#children.push(node);
      this.#rebalanceChildrenAgainst(node);
    } else {
      throw new Error("Could not add child to this node");
    }
  }

  #rebalanceChildrenAgainst(pivot: TreeNode) {
    let siblings = this.children.filter((c) => c !== pivot);

    siblings
      .filter((sib) => pivot.#value.canAcceptAsChild(sib.#value))
      .forEach((sib) => pivot.addChild(sib));
  }

  print() {
    let indent = 0;

    console.log("*** Printing Tree ***");

    let print = (node: TreeNode) => {
      console.log(
        `${" ".repeat(indent)} ${node.value.path} (${node.value.constructor.name})`,
      );
      indent++;
      node.children.map((child) => {
        console.log(
          `${" ".repeat(indent)} ${child.value.path} (${child.value.constructor.name})`,
        );
      });
      node.children.forEach(print);
      indent--;
    };

    print(this);

    console.log("*** Done Printing Tree ***");
  }

  findPageForPath(realPath: string): Page | undefined {
    let childValues = this.children.map((child) => child.value);
    let [staticAndDynamicPages, catchAllPages] = partition(
      childValues.filter((value) => value instanceof Page),
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
      // TODO: this should be DFS
      childValues
        .filter((value) => {
          let holdsPages =
            value instanceof Layout || value instanceof CatchBoundary;
          return holdsPages && pathPartialMatches(value.path, realPath);
        })
        .map((value) => value.tree.findPageForPath(realPath))
        .find(Boolean) ??
      catchAllPages.find((page) => pathMatches(page.path, realPath));

    return page;
  }
}
