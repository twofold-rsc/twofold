import { type ModuleSurface } from "../../vite/router-types.js";

export class API {
  #path: string;
  #loadModule: () => Promise<ModuleSurface>;

  constructor({
    path,
    loadModule,
  }: {
    path: string;
    loadModule: () => Promise<ModuleSurface>;
  }) {
    this.#path = path;
    this.#loadModule = loadModule;
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

  async loadModule() {
    return await this.#loadModule();
  }

  async preload() {
    await this.loadModule();
  }
}
