export class Wrapper {
  #path: string;
  #fileUrl: URL;

  constructor({ path, fileUrl }: { path: string; fileUrl: URL }) {
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
}
