import { Treeable, TreeNode } from "./tree-node.js";

export class ErrorTemplate implements Treeable {
  #tag: string;
  #path;
  #fileUrl: URL;

  tree: TreeNode;

  constructor({
    tag,
    path,
    fileUrl,
  }: {
    tag: string;
    path: string;
    fileUrl: URL;
  }) {
    this.#tag = tag;
    this.#path = path;
    this.#fileUrl = fileUrl;

    this.tree = new TreeNode(this);
  }

  get tag() {
    return this.#tag;
  }

  get path() {
    return this.#path;
  }

  addChild() {
    throw new Error("Cannot add children to error templates.");
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  canAcceptAsChild() {
    return false;
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }
}
