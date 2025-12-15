import { Layout } from "./layout.js";

type Node = Layout;

export type TreeNode = {
  tree: TreeStore;
  canGoUnderMe(other: Node): boolean;
};

export class TreeStore {
  // TODO: add value?
  parent: Node | null = null;
  children: Node[] = [];

  // detach() {
  //   if (this.#parent) {
  //     this.#parent.#children.delete(this);
  //     this.#parent = null;
  //   }
  // }

  detach(self: Node) {
    if (this.parent) {
      this.parent.tree.children = this.parent.tree.children.filter(
        (c) => c !== self,
      );
      this.parent = null;
    }
  }

  #isAncestorOf(maybeChild: Node, parent: Node) {
    let p = maybeChild.tree.parent;
    while (p) {
      if (p === parent) {
        return true;
      }
      p = p.parent;
    }
    return false;
  }

  addChild(self: Node, node: Node) {
    if (self === node) {
      throw new Error("A tree node cannot be its own child.");
    }

    if (this.#isAncestorOf(node, self)) {
      throw new Error("Cannot move a node under its own descendant.");
    }

    let addToChild = this.children.find((child) => child.canGoUnderMe(node));

    if (addToChild) {
      addToChild.addChild(node);
      this.#rebalanceChildrenAgainst(addToChild);
    } else {
      node.detach();
      node.tree.parent = self; // TODO: add set parent to node
      self.children.push(node);
      this.#rebalanceChildrenAgainst(node);
    }
  }

  setParent(self: Node, parent: Node | null) {
    if (parent === null) {
      this.detach(self);
    } else {
      parent.tree.addChild(parent, self);
    }
  }

  #rebalanceChildrenAgainst(pivot: Node) {
    let siblings = this.children.filter((c) => c !== pivot);

    siblings
      .filter((sib) => pivot.canGoUnderMe(sib))
      .forEach((sib) => pivot.tree.addChild(pivot, sib));
  }
}

// forward declarations for the Node union
// export class Layout implements TreeNode {
//   tree = new TreeStore();
//
//   constructor(public name: string) {}
//
//   canGoUnder(other: Node) {
//     // example rule: pages can go under layouts; layouts can go under layouts
//     if (other instanceof Layout) return true;
//     return false;
//   }
//
//   addChild(node: Node) {
//     this.tree.addChild(this, node);
//   }
//
//   detach() {
//     this.tree.detach(this);
//   }
//
//   setParent(parent: Node | null) {
//     this.tree.setParent(this, parent);
//   }
//
//   get parent() {
//     return this.tree.parent;
//   }
//
//   get children() {
//     return this.tree.children;
//   }
// }
