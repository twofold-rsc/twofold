import { watch, type FSWatcher } from "chokidar";
import path from "node:path";
import picomatch from "picomatch";
import { cwd } from "../files.js";

type FileCallback = () => void | Promise<void>;

type WatchRoute = {
  patterns: string[];
  callback: FileCallback;
};

type Options = {
  routes: WatchRoute[];
  ignores?: string[];
};

export class Watcher {
  #routes: {
    matchers: ((p: string) => boolean)[];
    callback: FileCallback;
  }[];
  #ignoreMatchers: ((p: string) => boolean)[];
  #watcher: FSWatcher | undefined;
  #cwd: string;

  constructor(options: Options) {
    this.#cwd = cwd;

    this.#routes = options.routes.map(({ patterns, callback }) => ({
      matchers: patterns.map((g) => picomatch(g, { dot: true })),
      callback,
    }));

    this.#ignoreMatchers = (options.ignores ?? []).map((g) =>
      picomatch(g, { dot: true }),
    );
  }

  async start(): Promise<void> {
    if (this.#watcher) return;

    this.#watcher = watch(".", {
      ignored: (p) => this.isIgnored(p),
      ignoreInitial: true,
    });

    const onFsEvent = async (fsPath: string) => {
      let rel = this.toRel(fsPath);
      if (this.isIgnored(rel)) {
        return;
      }

      let route = this.#routes.find((r) => r.matchers.some((m) => m(rel)));
      if (route) {
        await route.callback();
      }
    };

    this.#watcher
      .on("add", onFsEvent)
      .on("change", onFsEvent)
      .on("unlink", onFsEvent)
      .on("addDir", onFsEvent)
      .on("unlinkDir", onFsEvent);
  }

  async stop(): Promise<void> {
    if (this.#watcher) {
      await this.#watcher.close();
      this.#watcher = undefined;
    }
  }

  private isIgnored(p: string): boolean {
    const rel = this.toRel(p);
    return this.#ignoreMatchers.some((m) => m(rel));
  }

  private toRel(p: string): string {
    const rel = path.relative(this.#cwd, path.resolve(this.#cwd, p));
    return rel.split(path.sep).join("/");
  }
}
