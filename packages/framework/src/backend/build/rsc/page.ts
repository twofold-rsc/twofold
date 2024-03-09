import { ComponentType, ReactElement, createElement } from "react";
import { Layout } from "./layout.js";
import { RSC } from "./rsc.js";

export class Page {
  #rsc: RSC;
  #layout?: Layout;

  constructor({ rsc }: { rsc: RSC }) {
    this.#rsc = rsc;
  }

  get isDynamic() {
    return this.#rsc.path.includes("$");
  }

  get pattern() {
    return new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: this.#rsc.path.replace(/\/\$/g, "/:"),
    });
  }

  get rsc() {
    return this.#rsc;
  }

  set layout(layout: Layout | undefined) {
    this.#layout = layout;
  }

  get layout() {
    return this.#layout;
  }

  private get layouts() {
    let layouts = [];
    let layout = this.#layout;

    while (layout) {
      layouts.push(layout);
      layout = layout.parent;
    }

    return layouts.reverse();
  }

  async runMiddleware(request: Request) {
    let promises = [
      this.#rsc.runMiddleware(request),
      ...this.layouts.map((layout) => layout.rsc.runMiddleware(request)),
    ];

    await Promise.all(promises);
  }

  get assets() {
    return [
      ...this.layouts.map((layout) => layout.rsc.css),
      this.#rsc.css,
    ].filter(Boolean);
  }

  async reactTree(request: Request) {
    let url = new URL(request.url);
    let execPattern = this.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;
    let { page, layouts } = await this.components();

    let tree = componentsToTree({
      components: [...layouts, page],
      props: { params, searchParams, request },
    });

    return tree;
  }

  private async components() {
    let loadLayoutModules = this.layouts.map(async (layout) => {
      let module = await layout.rsc.loadModule();
      if (!module.default) {
        throw new Error(
          `Layout for ${layout.rsc.path}/ has no default export.`,
        );
      }
      return module.default;
    });

    let layouts = await Promise.all(loadLayoutModules);
    let module = await this.#rsc.loadModule();

    if (!module.default) {
      throw new Error(`Page ${this.rsc.path} has no default export.`);
    }

    return {
      page: module.default,
      layouts: layouts,
    };
  }
}

export function componentsToTree<T extends {}>({
  components,
  props,
}: {
  components: ComponentType<T>[];
  props: T;
}): ReactElement {
  if (components.length === 1) {
    return createElement<T>(components[0], props);
  } else {
    return createElement<T>(
      components[0],
      props,
      componentsToTree({
        components: components.slice(1),
        props,
      }),
    );
  }
}
