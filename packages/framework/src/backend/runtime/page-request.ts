import { Runtime } from "../runtime.js";
import { Page } from "../build/rsc/page.js";
import { getStore } from "../stores/rsc-store.js";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { ComponentType, createElement, ReactElement } from "react";
import { applyPathParams } from "./helpers/routing.js";
import xxhash from "xxhash-wasm";
import { invariant } from "../utils/invariant.js";

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

  get page() {
    return this.#page;
  }

  async rscResponse(): Promise<Response> {
    // setup store
    let store = getStore();
    if (store) {
      store.assets = this.assets;

      // TODO: we'll fork the store for page requests in the future. for now
      // we'll directly mutate it.
      store.context = {
        type: "page",
        request: this.#request,
        assets: this.assets,
      };
    }

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

    let renderStack = await this.routeStack();

    let { stream, error, redirect, notFound } =
      await this.#runtime.renderRSCStream({
        stack: renderStack,
      });

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
        urlString: url.toString(),
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

  private get dynamicParams() {
    let url = new URL(this.#request.url);
    let execPattern = this.#page.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    return params;
  }

  async routeStack() {
    let segments = await this.#page.segments();

    let params = this.dynamicParams;
    let props = this.props;

    // TODO: remove
    let catchBoundaryModule = await this.#runtime.catchBoundaryModule();
    let catchBoundaryComponent = catchBoundaryModule.default;

    let stack = segments.map((segment) => {
      let segmentKey = `${segment.path}:${applyPathParams(
        segment.path,
        params,
      )}`;

      // we hash the key because if they "look" like urls or paths
      // certain bots will try to crawl them
      let key = hash(segmentKey);

      let componentsWithProps = segment.components.map((component, index) => {
        return {
          component: component.func,
          props: {
            ...component.props,
            ...(component.requirements.includes("dynamicRequest") ? props : {}),
            ...(index === 0 ? { key } : {}),
          },
        };
      });

      return {
        type: "tree",
        tree: componentsToTree(componentsWithProps),
      };
    });

    return stack;
  }

  private get props() {
    // props that our rsc will get
    let url = new URL(this.#request.url);
    let params = this.dynamicParams;
    let searchParams = url.searchParams;
    let request = this.#request;

    return {
      params,
      searchParams,
      url,
      request,
    };
  }

  runMiddleware() {
    let layouts = this.#page.layouts;
    let props = this.props;

    let promises = [
      this.#page.runMiddleware(props),
      ...layouts.map((layout) => layout.runMiddleware(props)),
    ];

    return Promise.all(promises);
  }

  get assets() {
    let assets = this.#page.assets.map(
      (asset) => `/__tf/assets/styles/${asset}`,
    );
    return assets;
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

export function componentsToTree<T extends object>(
  list: {
    component: ComponentType<T>;
    props: T;
  }[],
): ReactElement {
  invariant(list[0], "Invalid component list");

  let { component, props } = list[0];
  if (list.length === 1) {
    return createElement<T>(component, props);
  } else {
    return createElement<T>(component, props, componentsToTree(list.slice(1)));
  }
}

let { h64Raw } = await xxhash();
function hash(str: string) {
  let encoder = new TextEncoder();
  let data = encoder.encode(str);
  let hash = h64Raw(data);
  return hash.toString(16);
}
