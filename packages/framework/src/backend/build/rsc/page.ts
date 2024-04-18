import { ComponentType, ReactElement, createElement } from "react";
import { Layout } from "./layout.js";
import { RSC } from "./rsc.js";
import "urlpattern-polyfill";

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
    let components = await this.components();

    let tree = componentsToTree({
      components,
      props,
    });

    return tree;
  }

  private async components() {
    // flat list of all modules the render tree needs
    // -> [Layout, Inner, Layout, Layout, Page]

    // get promises that load every parent module
    let loadParentModules = this.layouts.flatMap(async (layout) => {
      let components = await layout.components();
      return components;
    });

    // then transform those loads into a flat list of modules
    let loadedParentModules = await Promise.all(loadParentModules);
    let parents = loadedParentModules.flat();

    let module = await this.#rsc.loadModule();
    if (!module.default) {
      throw new Error(`Page ${this.rsc.path} has no default export.`);
    }

    return [...parents, module.default];
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
