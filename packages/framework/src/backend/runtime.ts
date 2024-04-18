import { DevBuild } from "./build/dev-build.js";
import { Worker } from "node:worker_threads";
import { PageRequest } from "./runtime/page-request.js";
import { create } from "./server.js";
import { ProdBuild } from "./build/prod-build.js";

export class Runtime {
  #hostname = "localhost";
  #port = 3000;
  #build: DevBuild | ProdBuild;
  #ssrWorker?: Worker;

  constructor(build: DevBuild | ProdBuild) {
    this.#build = build;
  }

  get build() {
    return this.#build;
  }

  get ssrWorker() {
    return this.#ssrWorker;
  }

  get clientComponentMap() {
    return this.#build.getBuilder("client").clientComponentMap;
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

  async start() {
    if (this.#build.env === "development") {
      this.#build.watch();
      this.#build.events.on("complete", async () => {
        this.createSSRWorker();
      });
    }

    this.createSSRWorker();
    await this.server();
  }

  // server

  private async server() {
    let server = await create(this);
    await server.start();
  }

  // pages

  pageRequest(request: Request) {
    let url = new URL(request.url);

    let page = this.#build
      .getBuilder("rsc")
      .tree.findPage((page) => page.pattern.test(url.pathname, this.baseUrl));

    let response = page
      ? new PageRequest({ page, request, runtime: this })
      : this.notFoundPageRequest(request);

    return response;
  }

  notFoundPageRequest(request: Request) {
    return new PageRequest({
      page: this.#build.getBuilder("rsc").notFoundPage,
      request,
      runtime: this,
      conditions: ["not-found"],
    });
  }

  // actions

  isAction(id: string) {
    let serverActionMap = this.#build.getBuilder("rsc").serverActionMap;
    return serverActionMap.has(id);
  }

  async getAction(id: string) {
    let serverActionMap = this.#build.getBuilder("rsc").serverActionMap;
    let action = serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    let module = await import(action.path);
    let fn = module[action.export];

    return fn;
  }

  async runAction(id: string, args: any[]) {
    let fn = await this.getAction(id);
    return fn.apply(null, args);
  }

  // workers

  private async createSSRWorker() {
    if (this.#ssrWorker) {
      await this.#ssrWorker.terminate();
      this.#ssrWorker = undefined;
    }

    if (!this.#build.error) {
      let bootstrapUrl = `/_assets/client-app/bootstrap/${this.#build.getBuilder("client").bootstrapHash}.js`;
      let workerUrl = new URL("./workers/ssr-worker.js", import.meta.url);

      this.#ssrWorker = new Worker(workerUrl, {
        workerData: {
          bootstrapUrl,
          appPath: this.#build.getBuilder("client").SSRAppPath,
          clientComponentModuleMap:
            this.#build.getBuilder("client").clientComponentModuleMap,
        },
        execArgv: ["-C", "default"],
        env: {
          NODE_OPTIONS: "",
          NODE_ENV: this.#build.env,
        },
      });
    }
  }
}
