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
  isUnauthorizedError,
  NotFoundError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { CompiledAction } from "../build/builders/rsc-builder.js";
import { pathToFileURL } from "url";
import { getStore } from "../stores/rsc-store.js";
import { serializeError } from "serialize-error";

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

type Result =
  | {
      type: "return";
      result: unknown;
    }
  | {
      type: "throw";
      error: Error;
    };

export class ActionRequest {
  #action: SPAAction | MPAAction;
  #request: Request;
  #runtime: Runtime;
  #temporaryReferences: unknown = createTemporaryReferenceSet();

  #result: Result | undefined = undefined;

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

    /// TODO: should be the same as unauthorized
    if (isNotFoundError(result)) {
      return this.notFoundRscResponse();
    }

    if (result.type === "throw" && isRedirectError(result.error)) {
      let { url } = redirectErrorInfo(result);
      return this.redirectResponse(url);
    }

    let requestToRender = this.requestToRender;
    let pageRequest = this.#runtime.pageRequest(requestToRender);

    let store = getStore();
    store.assets = pageRequest.assets;
    // see comment in page request file for this mutation
    store.context = {
      type: "page",
      request: requestToRender,
      assets: pageRequest.assets,
    };

    try {
      await pageRequest.runMiddleware();
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return this.notFoundRscResponse();
      } else if (isUnauthorizedError(err)) {
        //  TODO: handle middleware unauthorized
        // return this.unauthorizedRscResponse();
      } else if (isRedirectError(err)) {
        let { url } = redirectErrorInfo(err);
        return this.redirectResponse(url);
      } else {
        throw err;
      }
    }

    let stack = await pageRequest.routeStack();
    let formState = await this.#action.getFormState(result);

    let data = {
      stack,

      // if we try to give an error to react to serialize then it loses
      // some properties like digest. i think digest is really only
      // used when rendering. so we need to take ownership of doing
      // the error serialization. maybe a react bug?
      action:
        result.type === "throw"
          ? {
              ...result,
              error: serializeError(result.error),
            }
          : result,

      formState,
    };

    let { stream, error, redirect, unauthorized, notFound } =
      await this.#runtime.renderRSCStream(data, {
        temporaryReferences: this.#temporaryReferences,
      });

    // TODO: remove
    if (notFound) {
      stream.cancel();
      return this.notFoundRscResponse();
    } else if (redirect) {
      stream.cancel();
      return this.redirectResponse(redirect.url);
    }

    const isUnauthorized =
      (result.type === "throw" && isUnauthorizedError(result.error)) ||
      unauthorized;

    let status = isUnauthorized ? 401 : error ? 500 : 200;

    let headers = new Headers({
      "Content-type": "text/x-component",
    });

    return new Response(stream, {
      status,
      headers,
    });
  }

  async ssrResponse() {
    let result = await this.getResult();

    // how do handle with js disabled? think maybe ignore for now

    if (result.type === "throw") {
      if (isUnauthorizedError(result.error)) {
        return this.unauthorizedSsrResponse();
      } else if (isNotFoundError(result.error)) {
        return this.notFoundSsrResponse();
      } else if (isRedirectError(result.error)) {
        let { url } = redirectErrorInfo(result.error);
        return this.redirectResponse(url);
      } else {
        throw result.error;
      }
    }

    let rscResponse = await this.rscResponse();

    // response is not SSRable
    if (!rscResponse.body) {
      return rscResponse;
    }

    let rscStream = rscResponse.body;
    let url = new URL(this.#action.renderPath, this.#request.url);

    // TODO: a test here would be an action take works, but the page
    // it's rendered on now throws an error. we should deal with that
    // correctly.

    // TODO: remove
    // let { stream, notFound, unauthorized, redirect } =
    //   await this.#runtime.renderHtmlStreamFromRSCStream(rscStream, "page", {
    //     urlString: url.toString(),
    //   });
    //
    // if (notFound) {
    //   stream.cancel();
    //   return this.notFoundSsrResponse();
    // } else if (redirect) {
    //   stream.cancel();
    //   let { url } = redirect;
    //   return this.redirectResponse(url);
    // }

    let { stream } = await this.#runtime.renderHtmlStreamFromRSCStream(
      rscStream,
      "page",
      {
        urlString: url.toString(),
      },
    );

    let status = rscResponse.status;
    let headers = new Headers(rscResponse.headers);
    headers.set("Content-type", "text/html");

    return new Response(stream, {
      status,
      headers,
    });
  }

  async getResult() {
    if (!this.#result) {
      this.#result = await this.runAction();
    }

    return this.#result;
  }

  async runAction(): Promise<Result> {
    try {
      let result = await this.#action.runAction();
      return {
        type: "return",
        result,
      };
    } catch (err: unknown) {
      const isSafeError =
        isNotFoundError(err) ||
        isUnauthorizedError(err) ||
        isRedirectError(err);

      if (!isSafeError) {
        console.error(err);
      }

      let errorObject =
        err instanceof Error ? err : new Error("Action threw non error");

      return {
        type: "throw",
        error: errorObject,
      };
    }
  }

  async name() {
    let id = await this.#action.id();
    let [, name] = id.split("#");
    if (name?.startsWith("tf$serverFunction$")) {
      let parts = name.split("$");
      return parts[3] ?? id;
    } else if (name) {
      return name;
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

  private unauthorizedSsrResponse() {
    let unauthorizedRequest = this.#runtime.unauthorizedPageRequest(
      this.#request,
    );
    return unauthorizedRequest.ssrResponse();
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
      throw new NotFoundError();
    }

    return id;
  }

  private async args() {
    let request = this.#request;
    let temporaryReferences = this.#temporaryReferences;

    let args: unknown[] = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (!contentType) {
      return args;
    } else if (contentType.value === "text/plain") {
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

  async getFormState(result: Result) {
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
      request.method === "POST" &&
      contentType &&
      contentType.value === "multipart/form-data"
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
    throw new NotFoundError();
  }

  get renderPath() {
    let url = new URL(this.#request.url);
    return url.pathname;
  }

  async getAction() {
    let formData = await this.formData();
    let fn = await decodeAction(formData, this.#serverManifest);

    if (!fn || typeof fn !== "function") {
      throw new NotFoundError();
    }

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

  async getFormState(result: Result) {
    let formData = await this.formData();
    let formState = decodeFormState(
      result.type === "return" ? result.result : result.error,
      formData,
      this.#serverManifest,
    );
    return formState;
  }
}
