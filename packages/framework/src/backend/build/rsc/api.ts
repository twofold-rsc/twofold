import { RoutePath } from "./route-path.js";

export class API {
  #fileUrl: URL;
  #routePath: RoutePath;

  constructor({ path, fileUrl }: { path: string; fileUrl: URL }) {
    this.#routePath = new RoutePath(path);
    this.#fileUrl = fileUrl;
  }

  get path() {
    return this.#routePath.template;
  }

  get routePath() {
    return this.#routePath;
  }

  get isDynamic() {
    return this.#routePath.isDynamic;
  }

  get isCatchAll() {
    return this.#routePath.isCatchAll;
  }

  get dynamicSegments() {
    return this.#routePath.dynamicSegments;
  }

  get catchAllSegments() {
    return this.#routePath.catchAllSegments;
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }
}
