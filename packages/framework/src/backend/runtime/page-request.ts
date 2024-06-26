import { MessageChannel } from "node:worker_threads";
import { Runtime } from "../runtime";
import { Page } from "../build/rsc/page";
import { getStore } from "../stores/rsc-store.js";
import {
  renderToReadableStream,
  // @ts-ignore
} from "react-server-dom-webpack/server.edge";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { randomUUID } from "node:crypto";
import { deserializeError } from "serialize-error";

export class PageRequest {
  #page: Page;
  #request: Request;
  #runtime: Runtime;
  #conditions: string[];

  constructor({
    page,
    request,
    runtime,
    conditions,
  }: {
    page: Page;
    request: Request;
    runtime: Runtime;
    conditions?: string[];
  }) {
    this.#page = page;
    this.#request = request;
    this.#runtime = runtime;
    this.#conditions = conditions ?? [];
  }

  get isNotFound() {
    return this.#conditions.includes("not-found");
  }

  async rscResponse(): Promise<Response> {
    // middleware
    try {
      await this.runMiddleware();
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return this.notFoundRscResponse();
      } else if (isRedirectError(error)) {
        let { status, url } = redirectErrorInfo(error);
        return this.redirectResponse(status, url);
      } else {
        throw error;
      }
    }

    let store = getStore();
    let assets = this.#page.assets.map((asset) => `/_assets/styles/${asset}`);
    if (store) {
      store.assets = assets;
    }

    // rendering
    let streamError: unknown;
    let reactTree = await this.#page.reactTree(this.props);
    let rscStream = renderToReadableStream(
      reactTree,
      this.#runtime.clientComponentMap,
      {
        onError(err: unknown) {
          streamError = err;
          if (
            (isNotFoundError(err) || isRedirectError(err)) &&
            err instanceof Error &&
            "digest" in err &&
            typeof err.digest === "string"
          ) {
            return err.digest;
          } else if (err instanceof Error) {
            let digest =
              process.env.NODE_ENV === "production" ? randomUUID() : undefined;

            if (digest) {
              console.log(`Error digest: ${digest}`);
            }

            console.error(err);
            return digest;
          }
        },
      },
    );

    // await the first chunk
    let [t1, t2] = rscStream.tee();
    let reader = t1.getReader();
    await reader.read();
    reader.releaseLock();
    t1.cancel();

    if (streamError) {
      if (isNotFoundError(streamError)) {
        t2.cancel();
        return this.notFoundRscResponse();
      } else if (isRedirectError(streamError)) {
        t2.cancel();
        let { status, url } = redirectErrorInfo(streamError);
        return this.redirectResponse(status, url);
      }
    }

    // merge headers
    let headers = new Headers({
      "Content-type": "text/x-component",
    });

    let status = streamError
      ? 500
      : this.#conditions.includes("not-found")
        ? 404
        : 200;

    // give back the stream wrapped in a response
    return new Response(t2, {
      status,
      headers,
    });
  }

  async ssrResponse(): Promise<Response> {
    let rscResponse = await this.rscResponse();

    // response is not SSRable
    if (!rscResponse.body) {
      return rscResponse;
    }

    let rscStream = rscResponse.body;

    let { port1, port2 } = new MessageChannel();

    if (!this.#runtime.ssrWorker) {
      throw new Error("Worker not available");
    }

    let transformStream = new TransformStream();
    let writeStream = transformStream.writable;
    let readStream = transformStream.readable;

    let getMessage = new Promise<Record<string, any>>((resolve) => {
      let handle = function (msg: Record<string, any>) {
        resolve(msg);
        port1.off("message", handle);
        port1.close();
      };
      port1.on("message", handle);
    });

    let url = new URL(this.#request.url);
    this.#runtime.ssrWorker.postMessage(
      {
        pathname: url.pathname,
        port: port2,
        rscStream,
        writeStream,
      },
      // @ts-ignore - streams should be transferrable
      [port2, rscStream, writeStream],
    );

    let message = await getMessage;

    if (message.status === "OK") {
      let status = rscResponse.status;
      let headers = new Headers(rscResponse.headers);
      headers.set("Content-type", "text/html");

      return new Response(readStream, {
        status,
        headers,
      });
    } else if (message.status === "ERROR") {
      let error = deserializeError(message.serializedError);

      if (isNotFoundError(error)) {
        return this.notFoundSsrResponse();
      } else if (isRedirectError(error)) {
        let { status, url } = redirectErrorInfo(error);
        return this.redirectResponse(status, url);
      } else {
        throw error;
      }
    } else {
      throw new Error("SSR worker failed to render");
    }
  }

  private get props() {
    // props that our rsc will get
    let url = new URL(this.#request.url);
    let execPattern = this.#page.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;

    return {
      params,
      searchParams,
      request: this.#request,
    };
  }

  private async runMiddleware() {
    let rsc = this.#page.rsc;
    let layouts = this.#page.layouts;
    let props = this.props;

    let promises = [
      rsc.runMiddleware(props),
      ...layouts.map((layout) => layout.rsc.runMiddleware(props)),
    ];

    await Promise.all(promises);
  }

  private notFoundRscResponse() {
    if (this.isNotFound) {
      throw new Error("The not-found page cannot call notFound()");
    }

    let notFoundRequest = this.#runtime.notFoundPageRequest(this.#request);
    return notFoundRequest.rscResponse();
  }

  private notFoundSsrResponse() {
    if (this.isNotFound) {
      throw new Error("The not-found page cannot call notFound()");
    }

    let notFoundRequest = this.#runtime.notFoundPageRequest(this.#request);
    return notFoundRequest.ssrResponse();
  }

  private redirectResponse(status: number, url: string) {
    let isRSCFetch = this.#request.headers.get("accept") === "text/x-component";
    let requestUrl = new URL(this.#request.url);
    let redirectUrl = new URL(url, this.#request.url);
    let isRelative =
      redirectUrl.origin === requestUrl.origin && url.startsWith("/");

    if (isRSCFetch && isRelative) {
      let redirectRequest = new Request(redirectUrl, this.#request);
      let redirectPageRequest = this.#runtime.pageRequest(redirectRequest);

      let encodedPath = encodeURIComponent(redirectUrl.pathname);
      let resource = redirectPageRequest.isNotFound ? "not-found" : "page";
      let newUrl = `/__rsc/${resource}?path=${encodedPath}`;

      return new Response(null, {
        status,
        headers: {
          location: newUrl,
        },
      });
    }

    if (!isRSCFetch) {
      // this is a ssr request, we can redirect to the url
      return new Response(null, {
        status,
        headers: {
          location: url,
        },
      });
    } else {
      // this is a csr request, but the redirect is to a non-csr page
      // lets ask the browser to handle it
      let payload = JSON.stringify({
        type: "twofold-offsite-redirect",
        url,
        status,
      });
      return new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }
  }
}
