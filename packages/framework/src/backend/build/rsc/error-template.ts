import type { ModuleSurface } from "../../vite/router-types.js";
import { type Treeable, TreeNode } from "./tree-node.js";

export class ErrorTemplate implements Treeable {
  #tag: string;
  #path;
  #loadModule: () => Promise<ModuleSurface>;

  tree: TreeNode;

  constructor({
    tag,
    path,
    loadModule,
  }: {
    tag: string;
    path: string;
    loadModule: () => Promise<ModuleSurface>;
  }) {
    this.#tag = tag;
    this.#path = path;
    this.#loadModule = loadModule;

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
    return await this.#loadModule();
  }

  async preload() {
    await this.loadModule();
  }
}
