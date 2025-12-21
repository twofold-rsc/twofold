// import { partition } from "../../utils/partition.js";
// import { Layout } from "./layout.js";
//
// type Value = Layout;
//
// export class TreeNode {
//   value: Value;
//
//   #parent: TreeNode | null = null;
//   #children = new Set<TreeNode>();
//
//   constructor(value: Value) {
//     this.value = value;
//   }
//
//   get parent() {
//     return this.#parent;
//   }
//
//   get children() {
//     return Array.from(this.#children);
//   }
//
//   detach() {
//     if (this.#parent) {
//       this.#parent.#children.delete(this);
//       this.#parent = null;
//     }
//   }
//
//   private isAncestorOf(node: TreeNode) {
//     let p = node.#parent;
//     while (p) {
//       if (p === this) {
//         return true;
//       }
//       p = p.#parent;
//     }
//     return false;
//   }
//
//   addChild(node: TreeNode) {
//     if (node === this) {
//       throw new Error("A tree node cannot be its own child.");
//     }
//
//     if (node.isAncestorOf(this)) {
//       throw new Error("Cannot move a node under its own descendant.");
//     }
//
//     let addToChild = this.children.find((child) =>
//       child.value.acceptsAsAncestor(node.value),
//     );
//
//     if (addToChild) {
//       addToChild.addChild(node);
//       this.#rebalanceChildrenAgainst(addToChild);
//     } else {
//       node.detach();
//       node.#parent = this;
//       this.#children.add(node);
//       this.#rebalanceChildrenAgainst(node);
//     }
//   }
//
//   set parent(parent: TreeNode | null) {
//     if (parent === null) {
//       this.detach();
//     } else {
//       parent.addChild(this);
//     }
//   }
//
//   /**
//    * Rebalance children against a single pivot node. Useful after we add a node to
//    * the tree and want to see if our children can fit under it.
//    */
//   #rebalanceChildrenAgainst(pivot: TreeNode) {
//     let siblings = Array.from(this.#children).filter((c) => c !== pivot);
//
//     let [move, keep] = partition(siblings, (child) =>
//       child.value.canGoUnder(pivot.value),
//     );
//
//     move.forEach((child) => {
//       pivot.addChild(child);
//     });
//   }
// }
