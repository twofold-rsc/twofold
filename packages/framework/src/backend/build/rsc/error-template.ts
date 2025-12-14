export class ErrorWrapper {
  #tag: string;
  #path;
  #fileUrl: URL;

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
  }

  get tag() {
    return this.#tag;
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
