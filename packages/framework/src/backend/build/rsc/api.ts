import { AuthPolicyArray } from "../../auth/auth.js";
import { Treeable, TreeNode } from "./tree-node.js";

export class API implements Treeable {
  #path: string;
  #fileUrl: URL;

  tree: TreeNode;

  constructor({ path, fileUrl }: { path: string; fileUrl: URL }) {
    this.#path = path;
    this.#fileUrl = fileUrl;

    this.tree = new TreeNode(this);
  }

  canAcceptAsChild() {
    return false;
  }

  addChild() {
    throw new Error("Cannot add children to API routes.");
  }

  get children() {
    return this.tree.children.map((c) => c.value);
  }

  get parent() {
    return this.tree.parent?.value;
  }

  //

  get path() {
    return this.#path;
  }

  get isDynamic() {
    return this.#path.includes("$");
  }

  get isCatchAll() {
    return this.#path.includes("$$");
  }

  get dynamicSegments() {
    return this.#path.match(/(?<!\$)\$([^/]+)/g) ?? [];
  }

  get catchAllSegments() {
    return this.#path.match(/\$\$([^/]+)/g) ?? [];
  }

  get pattern() {
    let pathname = this.#path
      .replace(/\/\(.*\)\//g, "/")
      .replace(/\/\$\$(\w+)/g, "/:$1(.*)")
      .replace(/\/\$/g, "/:");

    return new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname,
    });
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }

  async getAuthPolicy(): Promise<AuthPolicyArray> {
    let module = await this.loadModule();
    if (module.auth) {
      return module.auth;
    } else {
      return [];
    }
  }
}
