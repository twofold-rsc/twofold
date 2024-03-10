import { ComponentType, ReactElement, createElement } from "react";
import { Layout } from "./layout.js";
import { RSC } from "./rsc.js";

type PageType = "page" | "not-found";

export class Page {
  #rsc: RSC;
  #layout?: Layout;
  #type: PageType;

  constructor({ rsc, type }: { rsc: RSC; type: PageType }) {
    this.#rsc = rsc;
    this.#type = type;
  }

  get isDynamic() {
    return this.#rsc.path.includes("$");
  }

  get type() {
    return this.#type;
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
    return [
      ...this.layouts.map((layout) => layout.rsc.css),
      this.#rsc.css,
    ].filter(Boolean);
  }

  async reactTree(props: Record<string, unknown>) {
    let { page, layouts } = await this.components();

    let tree = componentsToTree({
      components: [...layouts, page],
      props,
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
