import { Page } from "./page.js";
import { RSC } from "./rsc.js";
import { Wrapper } from "./wrapper.js";

export class Layout {
  #rsc: RSC;
  #children: Layout[] = [];
  #parent?: Layout;
  #pages: Page[] = [];
  #wrappers: Wrapper[] = [];

  constructor({ rsc }: { rsc: RSC }) {
    this.#rsc = rsc;
  }

  get rsc() {
    return this.#rsc;
  }

  get children() {
    return this.#children;
  }

  set parent(parent: Layout | undefined) {
    this.#parent = parent;
  }

  get parent() {
    return this.#parent;
  }

  add(child: Layout | Page) {
    if (child instanceof Layout) {
      this.addLayout(child);
    } else if (child instanceof Page) {
      this.addPage(child);
    }
  }

  findPage(f: (page: Page) => boolean): Page | undefined {
    let [dynamicPages, fixedPages] = partition(
      this.#pages,
      (page) => page.isDynamic,
    );

    let page =
      fixedPages.find(f) ||
      dynamicPages.find(f) ||
      this.#children.map((child) => child.findPage(f)).find(Boolean);

    return page;
  }

  print() {
    let indent = 0;

    console.log("*** Printing Tree ***");

    let print = (layout: Layout) => {
      console.log(`${" ".repeat(indent)} ${layout.rsc.path} (layout)`);
      indent++;
      layout.#pages.map((page) => {
        console.log(`${" ".repeat(indent)} ${page.rsc.path} (page)`);
      });
      layout.children.forEach(print);
      indent--;
    };

    print(this);

    console.log("*** Done Printing Tree ***");
  }

  private addLayout(layout: Layout) {
    // can it go under a child of mine?
    let child = this.#children.find((possibleParent) =>
      canGoUnder(layout, possibleParent),
    );

    if (child) {
      child.addLayout(layout);
    } else if (canGoUnder(layout, this)) {
      // re-balance my children
      let [move, keep] = partition(this.#children, (child) =>
        canGoUnder(child, layout),
      );
      this.#children = keep;

      // move the matching children to the new layout
      move.forEach((child) => layout.addLayout(child));

      // add to my children
      this.#children.push(layout);
      layout.parent = this;

      // readd all my pages?
      let pages = this.#pages;
      this.#pages = [];
      pages.forEach((page) => this.addPage(page));
    } else {
      // cant go under a child, cant go under me
      throw new Error(
        `Could not add layout ${layout.rsc.path} to ${this.rsc.path}`,
      );
    }
  }

  private addPage(page: Page) {
    let isMatch = page.rsc.path.startsWith(this.rsc.path);
    let matchingChild = this.#children.find((child) =>
      page.rsc.path.startsWith(child.rsc.path),
    );

    if (matchingChild) {
      matchingChild.addPage(page);
    } else if (isMatch) {
      this.#pages.push(page);
      page.layout = this;
    } else {
      throw new Error(
        `Could not add page ${page.rsc.path} to ${this.rsc.path}`,
      );
    }
  }

  addWrapper(wrapper: Wrapper) {
    this.#wrappers.push(wrapper);
  }

  async components() {
    // flat list of all the modules the render tree needs
    // -> [Layout, Inner, Providers, etc]

    let module = await this.#rsc.loadModule();
    if (!module.default) {
      throw new Error(`Layout for ${this.rsc.path}/ has no default export.`);
    }

    let loadWrapperModules = this.#wrappers.map(async (wrapper) => {
      let module = await wrapper.rsc.loadModule();
      if (!module.default) {
        throw new Error(
          `Wrapper for ${wrapper.rsc.path} has no default export.`,
        );
      }

      return module.default;
    });

    let loadedWrapperModules = await Promise.all(loadWrapperModules);
    let wrapperModules = loadedWrapperModules.flat();

    return [module.default, ...wrapperModules];
  }
}

/**
 * Can child go under parent
 *
 * @param child
 * @param parent
 * @returns
 */
function canGoUnder(child: Layout, parent: Layout) {
  let alreadyHave = parent.children.some(
    (current) => current.rsc.path === child.rsc.path,
  );
  let matchingPath =
    child.rsc.path.startsWith(parent.rsc.path) &&
    child.rsc.path !== parent.rsc.path;

  return !alreadyHave && matchingPath;
}

function partition<T>(arr: T[], condition: (item: T) => boolean) {
  return arr.reduce<[T[], T[]]>(
    (acc, item) => {
      if (condition(item)) {
        acc[0].push(item);
      } else {
        acc[1].push(item);
      }
      return acc;
    },
    [[], []],
  );
}
