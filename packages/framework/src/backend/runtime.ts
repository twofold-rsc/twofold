import { Build } from "./build.js";
import { Worker } from "node:worker_threads";
import { PageRequest } from "./runtime/page-request.js";
import { create } from "./server.js";

export class Runtime {
  #hostname = "localhost";
  #port = 3000;
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

  get baseUrl() {
    return `http://${this.hostname}:${this.port}`;
  }

  get hostname() {
    return this.#hostname;
  }

  get port() {
    return this.#port;
  }

  // server

  async server() {
    let server = await create(this);
    await server.start();
    this.#build.watch();
  }

  // pages

  pageRequest(request: Request) {
    let url = new URL(request.url);

    let page = this.#build.builders.rsc.tree.findPage((page) =>
      page.pattern.test(url.pathname, this.baseUrl),
    );

    let response = page
      ? new PageRequest({ page, request, runtime: this })
      : this.notFoundPageRequest(request);

    return response;
  }

  notFoundPageRequest(request: Request) {
    return new PageRequest({
      page: this.#build.builders.rsc.notFoundPage,
      request,
      runtime: this,
      status: 404,
    });
  }

  // actions

  isAction(id: string) {
    let serverActionMap = this.#build.builders.rsc.serverActionMap;
    return serverActionMap.has(id);
  }

  async runAction(id: string, args: any[]) {
    let serverActionMap = this.#build.builders.rsc.serverActionMap;
    let action = serverActionMap.get(id);

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
