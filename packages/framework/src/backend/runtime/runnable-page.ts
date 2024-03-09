import { MessageChannel } from "node:worker_threads";
import { Runtime } from "../runtime";
import { Page } from "../build/rsc/page";
import { getStore } from "../stores/rsc-store.js";
import {
  renderToReadableStream,
  // @ts-ignore
} from "react-server-dom-webpack/server.edge";

// Turns a built page into something that's runnable
export class RunnablePage {
  #page: Page;
  #request: Request;
  #runtime: Runtime;

  constructor({
    page,
    request,
    runtime,
  }: {
    page: Page;
    request: Request;
    runtime: Runtime;
  }) {
    this.#page = page;
    this.#request = request;
    this.#runtime = runtime;
  }

  async rscStream() {
    await this.runMiddleware();

    let store = getStore();

    let assets = this.#page.assets.map((asset) => `/_assets/styles/${asset}`);
    if (store) {
      store.assets = [...store.assets, ...assets];
    }

    // props that our rsc will get

    let url = new URL(this.#request.url);
    let execPattern = this.#page.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;

    let props = {
      params,
      searchParams,
      request: this.#request,
    };

    let reactTree = await this.#page.reactTree(props);
    let rscStream = renderToReadableStream(
      reactTree,
      this.#runtime.clientComponentMap,
      {
        onError(err: unknown) {
          console.log("RSC STREAM ERROR");
        },
      },
    );

    return rscStream;
  }

  async ssrStream() {
    let rscStream = await this.rscStream();

    let { port1, port2 } = new MessageChannel();

    let htmlStream = new ReadableStream({
      start(controller) {
        let handle = function (m: Uint8Array | string) {
          if (typeof m === "string" && m === "DONE") {
            controller.close();
            port1.off("message", handle);
            port1.close();
          } else {
            controller.enqueue(m);
          }
        };
        port1.on("message", handle);
      },
    });

    if (!this.#runtime.ssrWorker) {
      throw new Error("Worker not available");
    }

    let url = new URL(this.#request.url);

    this.#runtime.ssrWorker.postMessage(
      {
        pathname: url.pathname,
        port: port2,
      },
      [port2],
    );

    let reader = rscStream.getReader();
    reader.read().then(function processStream({
      done,
      value,
    }: {
      done: boolean;
      value: Uint8Array;
    }) {
      if (value) {
        port1.postMessage(value, [value.buffer]);
      }
      if (done) {
        port1.postMessage("DONE");
      } else {
        return reader.read().then(processStream);
      }
    });

    return htmlStream;
  }

  private async runMiddleware() {
    let rsc = this.#page.rsc;
    let layouts = this.#page.layouts;

    let promises = [
      rsc.runMiddleware(this.#request),
      ...layouts.map((layout) => layout.rsc.runMiddleware(this.#request)),
    ];

    await Promise.all(promises);
  }
}
