import { Layout } from "./layout.js";
import "urlpattern-polyfill";

export class Page {
  #path: string;
  #css?: string;
  #fileUrl: URL;

  #layout?: Layout;

  constructor({
    path,
    css,
    fileUrl,
  }: {
    path: string;
    css?: string;
    fileUrl: URL;
  }) {
    this.#path = path;
    this.#css = css;
    this.#fileUrl = fileUrl;
  }

  get path() {
    return this.#path;
  }

  get css() {
    return this.#css;
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

  set layout(layout: Layout | undefined) {
    this.#layout = layout;
  }

  get layout() {
    return this.#layout;
  }

  get layouts() {
    let layouts = [];
    let layout = this.#layout;

    while (layout) {
      layouts.push(layout);
      layout = layout.parent;
    }

    return layouts.reverse();
  }

  get assets() {
    return [...this.layouts.map((layout) => layout.css), this.#css].filter(
      Boolean
    );
  }

  async segments() {
    let loadLayouts = this.layouts.map(async (layout) => {
      let components = await layout.components();
      return {
        type: "layout",
        path: layout.path,
        components,
      };
    });

    let layouts = await Promise.all(loadLayouts);

    let components = await this.components();
    let page = {
      type: "page",
      path: this.#path,
      components,
    };

    return [...layouts, page];
  }

  private async components() {
    let module = await this.loadModule();
    if (!module.default) {
      throw new Error(`Page ${this.path} has no default export.`);
    }

    return [module.default];
  }

  async runMiddleware(props: {
    params: Record<string, string | undefined>;
    searchParams: URLSearchParams;
    request: Request;
  }) {
    let module = await this.loadModule();
    if (module.before) {
      await module.before(props);
    }
  }

  private async loadModule() {
    let module = await import(this.#fileUrl.href);
    return module;
  }
}
