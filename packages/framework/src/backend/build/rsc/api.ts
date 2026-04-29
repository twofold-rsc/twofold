import { AuthPolicyArray } from "../../auth/auth.js";
import { type ModuleSurface } from "../../vite/router-types.js";
import { Layout } from "./layout.js";
import { Treeable, TreeNode } from "./tree-node.js";

export class API implements Treeable {
  #path: string;
  #loadModule: () => Promise<ModuleSurface>;

  tree: TreeNode;

  constructor({
    path,
    loadModule,
  }: {
    path: string;
    loadModule: () => Promise<ModuleSurface>;
  }) {
    this.#path = path;
    this.#loadModule = loadModule;

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

  get parents() {
    let parents = this.tree.parents.map((node) => node.value);
    return parents.reverse();
  }

  get layouts() {
    return this.parents.filter((p) => p instanceof Layout);
  }

  async loadModule() {
    return await this.#loadModule();
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
