export class API {
  #path: string;
  #fileUrl: URL;

  constructor({ path, fileUrl }: { path: string; fileUrl: URL }) {
    this.#path = path;
    this.#fileUrl = fileUrl;
  }

  get isDynamic() {
    return this.#path.includes("$");
  }

  get pattern() {
    return new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: this.#path.replace(/\/\$/g, "/:"),
    });
  }

  async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }
}
