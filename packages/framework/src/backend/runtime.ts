import { Build } from "./build.js";
import { Worker } from "node:worker_threads";
import { RunnablePage } from "./runtime/runnable-page.js";

export class Runtime {
  #base = "http://localhost:3000";
  #build: Build;
  #ssrWorker?: Worker;

  constructor(build: Build) {
    this.#build = build;
    build.events.on("complete", async () => {
      this.createSSRWorker();
    });
  }

  get build() {
    return this.#build;
  }

  get ssrWorker() {
    return this.#ssrWorker;
  }

  get clientComponentMap() {
    return this.#build.builders.client.clientComponentMap;
  }

  // pages

  pageForRequest(request: Request) {
    let url = new URL(request.url);

    let page =
      this.#build.builders.rsc.tree.findPage((page) =>
        page.pattern.test(url.pathname, this.#base),
      ) ?? this.#build.builders.rsc.notFoundPage;

    return new RunnablePage({
      page: page,
      request: request,
      runtime: this,
    });
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

  // workers

  private async createSSRWorker() {
    if (this.#ssrWorker) {
      await this.#ssrWorker.terminate();
      this.#ssrWorker = undefined;
    }

    if (!this.#build.error) {
      let bootstrapUrl = `/_assets/client-app/bootstrap/${this.#build.builders.client.bootstrapHash}.js`;
      let workerUrl = new URL("./workers/ssr-worker.js", import.meta.url);

      this.#ssrWorker = new Worker(workerUrl, {
        workerData: {
          bootstrapUrl,
          appPath: this.#build.builders.client.SSRAppPath,
          clientComponentModuleMap:
            this.#build.builders.client.clientComponentModuleMap,
        },
        execArgv: ["-C", "default"],
        env: {
          NODE_OPTIONS: "",
        },
      });
    }
  }
}
