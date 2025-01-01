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

  get isCatchAll() {
    return this.#path.includes("$$");
  }

  get pattern() {
    let pathname = this.#path
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
}
