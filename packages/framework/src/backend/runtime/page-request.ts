import { MessageChannel } from "node:worker_threads";
import { Runtime } from "../runtime";
import { Page } from "../build/rsc/page";
import { getStore } from "../stores/rsc-store.js";
import {
  renderToReadableStream,
  // @ts-ignore
} from "react-server-dom-webpack/server.edge";
import { NotFoundError } from "../errors/not-found-error.js";
import { readStream } from "../steams/process-stream.js";

export class PageRequest {
  #page: Page;
  #request: Request;
  #runtime: Runtime;
  #status: number;

  constructor({
    page,
    request,
    runtime,
    status = 200,
  }: {
    page: Page;
    request: Request;
    runtime: Runtime;
    status?: number;
  }) {
    this.#page = page;
    this.#request = request;
    this.#runtime = runtime;
    this.#status = status;
  }

  get isNotFound() {
    return this.#page.type === "not-found";
  }

  async rscResponse(): Promise<Response> {
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

    let notFound = false;
    let reactTree = await this.#page.reactTree(props);
    let rscStream = renderToReadableStream(
      reactTree,
      this.#runtime.clientComponentMap,
      {
        onError(err: unknown) {
          console.log("rsc onError");
          if (err instanceof Error && "isTwofoldError" in err) {
            notFound = true;
          }
        },
      },
    );

    // await the first chunk
    let [t1, t2] = rscStream.tee();
    let reader = t1.getReader();
    await reader.read();

    // if there's a twofold error and the first chunk hasn't been sent
    // then we can abort
    if (notFound) {
      console.log("got a not found before returning");
      reader.releaseLock();
      t1.cancel();
      t2.cancel();

      if (this.#status === 404) {
        // page is already marked as 404
        throw new Error("The not-found page cannot call notFound()");
      } else {
        console.log("page invoked not found, so rendering not found page");
        // ask the runtime for the not found page
        let notFoundRequest = this.#runtime.notFoundPageRequest(this.#request);
        // merge headers?
        return notFoundRequest.rscResponse();
      }
    } else {
      // were done with t1
      reader.releaseLock();
      t1.cancel();
    }

    // merge headers
    let headers = new Headers({
      "Content-type": "text/x-component",
    });

    // give back the stream wrapped in a response
    return new Response(t2, {
      status: this.#status,
      headers,
    });
  }

  async ssrResponse() {
    let rscResponse = await this.rscResponse();

    // response is not SSRable
    if (!rscResponse.body) {
      return rscResponse;
    }

    let rscStream = rscResponse.body;

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

    readStream(rscStream, {
      onRead(value) {
        port1.postMessage(value, [value.buffer]);
      },
      onDone() {
        port1.postMessage("DONE");
      },
    });

    let headers = new Headers(rscResponse.headers);
    headers.set("Content-type", "text/html");

    return new Response(htmlStream, {
      status: rscResponse.status,
      headers,
    });
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
