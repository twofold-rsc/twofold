import { parseHeaderValue } from "@hattip/headers";
import { Runtime } from "../runtime.js";
import {
  decodeReply,
  decodeAction,
  createTemporaryReferenceSet,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/server.edge'.
} from "react-server-dom-webpack/server.edge";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { CompiledAction } from "../build/builders/rsc-builder.js";
import { pathToFileURL } from "url";
import { getStore } from "../stores/rsc-store.js";

type ServerManifest = Record<
  string,
  | {
      id: string;
      name: string;
      chunks: string[];
    }
  | undefined
>;

type ServerActionMap = Map<string, CompiledAction>;

export class ActionRequest {
  #action: SPAAction | MPAAction;
  #request: Request;
  #runtime: Runtime;
  #temporaryReferences: unknown = createTemporaryReferenceSet();

  constructor({
    request,
    runtime,
    serverActionMap,
    serverManifest,
  }: {
    request: Request;
    runtime: Runtime;
    serverManifest: ServerManifest;
    serverActionMap: ServerActionMap;
  }) {
    this.#request = request;
    this.#runtime = runtime;

    if (SPAAction.matches(request)) {
      this.#action = new SPAAction({
        request,
        serverActionMap,
        temporaryReferences: this.#temporaryReferences,
      });
    } else if (MPAAction.matches(request)) {
      this.#action = new MPAAction({ request, serverManifest });
    } else {
      throw new Error("Invalid request");
    }
  }

  static isActionRequest(request: Request) {
    return SPAAction.matches(request) || MPAAction.matches(request);
  }

  async rscResponse() {
    let result = await this.runAction();

    let requestToRender = this.requestToRender;

    if (isNotFoundError(result)) {
      return this.notFoundRscResponse();
    }

    if (isRedirectError(result)) {
      let { url } = redirectErrorInfo(result);
      return this.redirectResponse(url);
    }

    let pageRequest = this.#runtime.pageRequest(requestToRender);

    try {
      await pageRequest.runMiddleware();
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return this.notFoundRscResponse();
      } else if (isRedirectError(err)) {
        let { url } = redirectErrorInfo(err);
        return this.redirectResponse(url);
      } else {
        throw err;
      }
    }

    let store = getStore();
    store.assets = pageRequest.assets;

    let reactTree = await pageRequest.reactTree();

    let data = this.#action.canStreamResult
      ? {
          render: reactTree,
          action: result,
        }
      : reactTree;

    let { stream, error, redirect, notFound } =
      await this.#runtime.renderRSCStream(data, {
        temporaryReferences: this.#temporaryReferences,
      });

    if (notFound) {
      stream.cancel();
      return this.notFoundRscResponse();
    } else if (redirect) {
      stream.cancel();
      return this.redirectResponse(redirect.url);
    }

    let status = error ? 500 : 200;
    let headers = new Headers({
      "Content-type": "text/x-action-component",
    });

    return new Response(stream, {
      status,
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
    let url = new URL(this.#action.renderPath, this.#request.url);

    let { stream, notFound, redirect } =
      await this.#runtime.renderHtmlStreamFromRSCStream(rscStream, "page", {
        urlString: url.toString(),
      });

    if (notFound) {
      return this.notFoundSsrResponse();
    } else if (redirect) {
      let { url } = redirect;
      return this.redirectResponse(url);
    }

    let status = rscResponse.status;
    let headers = new Headers(rscResponse.headers);
    headers.set("Content-type", "text/html");

    return new Response(stream, {
      status,
      headers,
    });
  }

  private async runAction() {
    let fn = await this.#action.getAction();

    let result;
    try {
      result = await fn();
    } catch (err: unknown) {
      if (isNotFoundError(err) || isRedirectError(err)) {
        result = err;
      } else {
        // rethrow
        throw err;
      }
    }

    return result;
  }

  get name() {
    let id = this.#action.id;
    let [, name] = id.split("#");
    if (name?.startsWith("tf$serverFunction$")) {
      let parts = name.split("$");
      return parts[3] ?? id;
    } else {
      return id;
    }
  }

  private get requestToRender() {
    let url = new URL(this.#request.url);
    let requestUrl = new URL(this.#action.renderPath, url);
    let requestToRender = new Request(requestUrl, {
      ...this.#request,
      headers: this.#request.headers,
      method: "GET",
      body: null,
    });

    return requestToRender;
  }

  private notFoundRscResponse() {
    let pageRequest = this.#runtime.notFoundPageRequest(this.requestToRender);
    return pageRequest.rscResponse();
  }

  private notFoundSsrResponse() {
    let notFoundRequest = this.#runtime.notFoundPageRequest(this.#request);
    return notFoundRequest.ssrResponse();
  }

  private redirectResponse(url: string) {
    let requestUrl = new URL(this.requestToRender.url, this.#request.url);
    let redirectUrl = new URL(url, this.#request.url);
    let isRelative =
      redirectUrl.origin === requestUrl.origin && url.startsWith("/");

    if (isRelative) {
      let redirectRequest = new Request(redirectUrl, this.requestToRender);
      let redirectPageRequest = this.#runtime.pageRequest(redirectRequest);

      let encodedPath = encodeURIComponent(redirectUrl.pathname);
      let resource = redirectPageRequest.isNotFound ? "not-found" : "page";
      let newUrl = `/__rsc/${resource}?path=${encodedPath}`;

      return new Response(null, {
        status: 303,
        headers: {
          location: newUrl,
        },
      });
    } else {
      // we could not return a redirect to a page with an rsc payload, so lets
      // let the action on the browser know it needs to handle this redirect
      let payload = JSON.stringify({
        type: "twofold-offsite-redirect",
        url,
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

// Action request
// figure out which type of action we have
// run it
// render it

interface Action {
  getAction: () => Promise<() => unknown>;
  renderPath: string;
  id: string;
  canStreamResult: boolean;
}

class SPAAction implements Action {
  #request: Request;
  #serverActionMap: ServerActionMap;
  #temporaryReferences: unknown;

  canStreamResult = true;

  constructor({
    request,
    serverActionMap,
    temporaryReferences,
  }: {
    request: Request;
    serverActionMap: ServerActionMap;
    temporaryReferences: unknown;
  }) {
    this.#request = request;
    this.#serverActionMap = serverActionMap;
    this.#temporaryReferences = temporaryReferences;
  }

  static matches(request: Request) {
    let url = new URL(request.url);
    let pattern = new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: "/__rsc/action/:id",
    });

    return pattern.test(url);
  }

  get id() {
    let url = new URL(this.#request.url);
    let pattern = new URLPattern({
      protocol: "http{s}?",
      hostname: "*",
      pathname: "/__rsc/action/:id",
    });

    let exec = pattern.exec(url);
    let urlId = exec?.pathname.groups.id;

    let id = urlId ? decodeURIComponent(urlId) : null;

    if (!id) {
      throw new Error("No server action specified");
    }

    return id;
  }

  private async args() {
    let request = this.#request;
    let temporaryReferences = this.#temporaryReferences;

    let args = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (contentType.value === "text/plain") {
      let text = await request.text();
      args = await decodeReply(text, {}, { temporaryReferences });
    } else if (contentType.value === "multipart/form-data") {
      let formData = await request.formData();
      args = await decodeReply(formData, {}, { temporaryReferences });
    }

    return args;
  }

  get renderPath() {
    let url = new URL(this.#request.url);
    let path = url.searchParams.get("path");

    if (!path) {
      throw new Error("No path specified");
    }

    return path;
  }

  private get compiledAction() {
    let id = this.id;
    let action = this.#serverActionMap.get(id);

    if (!action) {
      throw new Error("Invalid action id");
    }

    return action;
  }

  async getAction() {
    let compiledAction = this.compiledAction;
    let actionUrl = pathToFileURL(compiledAction.path);
    let module = await import(actionUrl.href);
    let fn = module[compiledAction.export];

    if (typeof fn !== "function") {
      throw new Error(
        `Expected server action ${compiledAction.export} to be a function`,
      );
    }

    let args = await this.args();

    return fn.bind(null, ...args);
  }
}

class MPAAction implements Action {
  #request: Request;
  #serverManifest: ServerManifest;

  canStreamResult = false;

  constructor({
    request,
    serverManifest,
  }: {
    request: Request;
    serverManifest: ServerManifest;
  }) {
    this.#request = request;
    this.#serverManifest = serverManifest;
  }

  static matches(request: Request) {
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    return (
      request.method === "POST" && contentType.value === "multipart/form-data"
    );
  }

  get id() {
    // we should try to extract the id out of the formData
    // TODO
    return "NOT IMPLEMENTED YEY";
  }

  get renderPath() {
    let url = new URL(this.#request.url);
    return url.pathname;
  }

  async getAction() {
    let formData = await this.#request.formData();
    let fn = await decodeAction(formData, this.#serverManifest);
    return fn;
  }
}

// ActionResponse
