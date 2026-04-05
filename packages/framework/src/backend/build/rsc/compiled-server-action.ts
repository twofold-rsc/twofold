import { pathToFileURL } from "url";
import { Node, Treeable, TreeNode } from "./tree-node.js";
import { AuthPolicyArray } from "../../auth/auth.js";

export type SerializedServerAction = {
  id: string;
  moduleId: string;
  path: string;
  virtualPath: string;
  hash: string;
  export: string;
};

export class CompiledServerAction implements Treeable {
  #id: string;
  #moduleId: string;
  #path: string;
  #virtualPath: string;
  #hash: string;
  #export: string;

  tree: TreeNode;

  constructor(action: SerializedServerAction) {
    this.#id = action.id;
    this.#moduleId = action.moduleId;
    this.#path = action.path;
    this.#virtualPath = action.virtualPath;
    this.#hash = action.hash;
    this.#export = action.export;

    this.tree = new TreeNode(this);
  }

  get path() {
    return this.#virtualPath + "#" + this.export;
  }

  canAcceptAsChild(): boolean {
    return false;
  }

  addChild() {
    throw new Error("Cannot add children to server actions.");
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  serialize(): SerializedServerAction {
    return {
      id: this.#id,
      moduleId: this.#moduleId,
      path: this.#path,
      virtualPath: this.#virtualPath,
      hash: this.#hash,
      export: this.#export,
    };
  }

  get id(): string {
    return this.#id;
  }

  get moduleId(): string {
    return this.#moduleId;
  }

  get filePath(): string {
    return this.#path;
  }

  get serverManifestEntry(): {
    id: string;
    name: string;
    chunks: string[];
  } {
    return {
      id: this.#id,
      name: this.#export,
      chunks: [`${this.#moduleId}:${this.#export}:${this.#hash}`],
    };
  }

  async preload() {
    await import(pathToFileURL(this.#path).href);
  }

  get export(): string {
    return this.#export;
  }

  async getAuthPolicy(): Promise<AuthPolicyArray> {
    let actionUrl = pathToFileURL(this.filePath);
    let module = await import(actionUrl.href);
    if (module.auth) {
      return module.auth;
    } else {
      return [];
    }
  }
}
