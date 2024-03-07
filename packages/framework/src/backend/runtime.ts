import { Build } from "./build.js";

export class Runtime {
  #base = "http://localhost:3000";
  #build: Build;

  constructor(build: Build) {
    this.#build = build;
  }

  // pages

  pageForRequest(request: Request) {
    return this.pageForUrl(new URL(request.url));
  }

  pageForUrl(url: URL) {
    let { pathname } = url;
    return this.pageForPath(pathname);
  }

  private pageForPath(path: string) {
    return this.#build.builders.rsc.tree.findPage((page) =>
      page.pattern.test(path, this.#base),
    );
  }

  // actions

  private get serverActionMap() {
    return this.#build.builders.rsc.serverActionMap;
  }

  isAction(id: string) {
    return this.serverActionMap.has(id);
  }

  async runAction(id: string, args: any[]) {
    let action = this.serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    let module = await import(action.path);
    let fn = module[action.export];

    return fn.apply(null, args);
  }
}
