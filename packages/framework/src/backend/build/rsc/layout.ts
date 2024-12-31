import { Page } from "./page.js";
import { Wrapper } from "./wrapper.js";

export class Layout {
  #path: string;
  #css?: string;
  #fileUrl: URL;

  #children: Layout[] = [];
  #parent?: Layout;
  #pages: Page[] = [];
  #wrappers: Wrapper[] = [];

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
    this.#fileUrl = fileUrl;
    this.#css = css;
  }

  get path() {
    return this.#path;
  }

  get css() {
    return this.#css;
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
    // this is incredibly inefficient, should have better tree based search
    let sortBy = (a: Page, b: Page) =>
      a.dynamicSegments.length - b.dynamicSegments.length;
    let searchPages = this.#pages.toSorted(sortBy);

    let page =
      searchPages.find(f) ||
      this.#children.map((child) => child.findPage(f)).find(Boolean);

    return page;
  }

  print() {
    let indent = 0;

    console.log("*** Printing Tree ***");

    let print = (layout: Layout) => {
      console.log(`${" ".repeat(indent)} ${layout.path} (layout)`);
      indent++;
      layout.#pages.map((page) => {
        console.log(`${" ".repeat(indent)} ${page.path} (page)`);
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
      throw new Error(`Could not add layout ${layout.path} to ${this.path}`);
    }
  }

  private addPage(page: Page) {
    let isMatch = page.path.startsWith(this.path);
    let matchingChild = this.#children.find((child) =>
      page.path.startsWith(child.path),
    );

    if (matchingChild) {
      matchingChild.addPage(page);
    } else if (isMatch) {
      this.#pages.push(page);
      page.layout = this;
    } else {
      throw new Error(`Could not add page ${page.path} to ${this.path}`);
    }
  }

  addWrapper(wrapper: Wrapper) {
    this.#wrappers.push(wrapper);
  }

  async components() {
    // flat list of all the modules the render tree needs
    // -> [Layout, Inner, Providers, etc]

    let module = await this.loadModule();
    if (!module.default) {
      throw new Error(`Layout for ${this.path}/ has no default export.`);
    }

    let loadWrapperModules = this.#wrappers.map(async (wrapper) => {
      let module = await wrapper.loadModule();
      if (!module.default) {
        throw new Error(`Wrapper for ${wrapper.path} has no default export.`);
      }

      return module.default;
    });

    let loadedWrapperModules = await Promise.all(loadWrapperModules);
    let wrapperModules = loadedWrapperModules.flat();

    return [module.default, ...wrapperModules];
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

/**
 * Can child go under parent
 *
 * @param child
 * @param parent
 * @returns
 */
function canGoUnder(child: Layout, parent: Layout) {
  let alreadyHave = parent.children.some(
    (current) => current.path === child.path,
  );
  let matchingPath =
    child.path.startsWith(parent.path) && child.path !== parent.path;

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
