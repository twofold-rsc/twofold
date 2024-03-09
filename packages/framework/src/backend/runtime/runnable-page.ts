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

  async rscStream(request: Request) {
    await this.#page.runMiddleware(request);

    let store = getStore();

    let assets = this.#page.assets.map((asset) => `/_assets/styles/${asset}`);
    if (store) {
      store.assets = [...store.assets, ...assets];
    }

    let reactTree = await this.#page.reactTree(request);
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

  async ssrStream(request: Request) {
    let rscStream = await this.rscStream(request);

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

    let url = new URL(request.url);

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
}
