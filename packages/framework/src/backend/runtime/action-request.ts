import { parseHeaderValue } from "@hattip/headers";
import { Runtime } from "../runtime.js";
import {
  decodeReply,
  decodeAction,
  decodeFormState,
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

  #result: unknown;
  #didRun = false;

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
    let result = await this.getResult();
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
    let formState = await this.#action.getFormState(result);

    let data = {
      tree: reactTree,
      action: result,
      formState,
    };

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
      "Content-type": "text/x-component",
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

  async getResult() {
    if (!this.#didRun) {
      let result = await this.runAction();
      this.#result = result;
      this.#didRun = true;
    }

    return this.#result;
  }

  async runAction() {
    let result;
    try {
      result = await this.#action.runAction();
    } catch (err: unknown) {
      if (isNotFoundError(err) || isRedirectError(err)) {
        result = err;
      } else {
        // rethrow
        console.error(err);
        throw err;
      }
    }

    return result;
  }

  async name() {
    let id = await this.#action.id();
    let [, name] = id.split("#");
    if (name?.startsWith("tf$serverFunction$")) {
      let parts = name.split("$");
      return parts[3] ?? id;
    } else {
      return name;
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

interface Action<T = unknown> {
  getAction: () => Promise<() => T>;
  runAction: () => Promise<T>;
  renderPath: string;
  id: () => Promise<string> | string;
}

class SPAAction implements Action {
  #request: Request;
  #serverActionMap: ServerActionMap;
  #temporaryReferences: unknown;

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

  id() {
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

  get compiledAction() {
    let id = this.id();
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

  async getFormState(result: unknown) {
    return null;
  }

  async runAction() {
    let fn = await this.getAction();
    return fn();
  }
}

class MPAAction implements Action {
  #request: Request;
  #serverManifest: ServerManifest;
  #formData: FormData | null = null;

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

  async id() {
    let formData = await this.formData();

    let id = formData
      .entries()
      .map(([key, value]) => {
        if (key.startsWith("$ACTION_ID_")) {
          return key.replace(/^\$ACTION_ID_/, "");
        }
      })
      .find(Boolean);

    if (id) {
      return id;
    }

    let actionRef = formData
      .entries()
      .map(([key, value]) => {
        if (key.startsWith("$ACTION_REF_")) {
          return key.replace(/^\$ACTION_REF_/, "");
        }
      })
      .find(Boolean);

    if (actionRef) {
      let data = formData.get(`$ACTION_${actionRef}:0`);
      if (typeof data === "string") {
        try {
          let action = JSON.parse(data);
          let id = action.id;
          if (typeof id === "string") {
            return id;
          }
        } catch {
          // ignore
        }
      }
    }

    // if were here we don't have an id
    throw new Error("No server action specified");
  }

  get renderPath() {
    let url = new URL(this.#request.url);
    return url.pathname;
  }

  async getAction() {
    let formData = await this.formData();
    let fn = await decodeAction(formData, this.#serverManifest);
    return fn;
  }

  private async formData() {
    if (!this.#formData) {
      this.#formData = await this.#request.formData();
    }

    return this.#formData;
  }

  async runAction() {
    let fn = await this.getAction();
    return fn();
  }

  async getFormState(result: unknown) {
    let formData = await this.formData();
    let formState = decodeFormState(result, formData, this.#serverManifest);
    return formState;
  }
}
