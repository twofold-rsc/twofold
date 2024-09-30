import { Runtime } from "../runtime";
import { Page } from "../build/rsc/page";
import { getStore } from "../stores/rsc-store.js";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { forwardedRequest } from "./helpers/request.js";

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

    let reactTree = await this.#page.reactTree(this.props);

    let { stream, error, redirect, notFound } =
      await this.#runtime.renderRSCStreamFromTree(reactTree);

    if (notFound) {
      stream.cancel();
      return this.notFoundRscResponse();
    } else if (redirect) {
      stream.cancel();
      return this.redirectResponse(redirect.status, redirect.url);
    }

    // merge headers
    let headers = new Headers({
      "Content-type": "text/x-component",
    });

    let status = error
      ? 500
      : this.#conditions.includes("not-found")
        ? 404
        : 200;

    // give back the stream wrapped in a response
    return new Response(stream, {
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
    let url = new URL(this.#request.url);

    let { stream, notFound, redirect } =
      await this.#runtime.renderHtmlStreamFromRSCStream(rscStream, "page", {
        path: url.pathname,
      });

    if (notFound) {
      return this.notFoundSsrResponse();
    } else if (redirect) {
      let { status, url } = redirect;
      return this.redirectResponse(status, url);
    }

    let status = rscResponse.status;
    let headers = new Headers(rscResponse.headers);
    headers.set("Content-type", "text/html");

    return new Response(stream, {
      status,
      headers,
    });
  }

  private get props() {
    // props that our rsc will get
    let url = new URL(this.#request.url);
    let execPattern = this.#page.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;
    let request = forwardedRequest(this.#request);

    return {
      params,
      searchParams,
      request,
    };
  }

  private runMiddleware() {
    let rsc = this.#page.rsc;
    let layouts = this.#page.layouts;
    let props = this.props;

    let promises = [
      rsc.runMiddleware(props),
      ...layouts.map((layout) => layout.rsc.runMiddleware(props)),
    ];

    return Promise.all(promises);
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
