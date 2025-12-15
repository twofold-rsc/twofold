import { Layout } from "./layout.js";
import { Page } from "./page.js";

export class CatchBoundary {
  #path;
  #fileUrl: URL;

  #children: (Layout | CatchBoundary)[] = [];
  #pages: Page[] = [];

  constructor({ path, fileUrl }: { tag: string; path: string; fileUrl: URL }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
  }

  get path() {
    return this.#path;
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }

  async preload() {
    await this.loadModule();
  }
}
