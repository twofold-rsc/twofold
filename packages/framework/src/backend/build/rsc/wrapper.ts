export class Wrapper {
  #path: string;
  #fileUrl: URL;
  #type: "outer" | "inner";

  constructor({
    path,
    fileUrl,
    type,
  }: {
    path: string;
    fileUrl: URL;
    type: "outer" | "inner";
  }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
    this.#type = type;
  }

  get path() {
    return this.#path;
  }

  get type() {
    return this.#type;
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }
}
