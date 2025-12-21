import { Layout } from "./layout.js";
import { Page } from "./page.js";

export type Node = Layout | Page;

export type Treeable = {
  tree: TreeNode;
  canAcceptAsChild(other: Node): boolean;

  addChild: (node: Node) => void;

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
      console.log("this", this.value.path);
      console.log("adding", node.value.path);
      throw new Error("Could not add child to this node");
    }
  }

  #rebalanceChildrenAgainst(pivot: TreeNode) {
    let siblings = this.children.filter((c) => c !== pivot);

    siblings
      .filter((sib) => pivot.#value.canAcceptAsChild(sib.#value))
      .forEach((sib) => pivot.addChild(sib));
  }
}
