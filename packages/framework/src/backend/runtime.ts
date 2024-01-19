import { Build } from "./build.js";

export class Runtime {
  #base = "http://localhost:3000";
  #build: Build;

  constructor(build: Build) {
    this.#build = build;
  }

  pageForRequest(request: Request) {
    return this.pageForUrl(new URL(request.url));
  }

  pageForUrl(url: URL) {
    let { pathname } = url;
    return this.pageForPath(pathname);
  }

  private pageForPath(path: string) {
    return this.#build.rsc.tree.findPage((page) =>
      page.pattern.test(path, this.#base)
    );
  }

  // add action stuff
}
