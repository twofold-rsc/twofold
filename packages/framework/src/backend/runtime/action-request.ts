import { parseHeaderValue } from "@hattip/headers";
import { Runtime } from "../runtime.js";

import {
  decodeReply,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/server.edge'.
} from "react-server-dom-webpack/server.edge";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./helpers/errors.js";
import { CompiledAction } from "../build/builders/rsc-builder.js";
import { pathToFileURL } from "url";

export class ActionRequest {
  #action: CompiledAction;
  #request: Request;
  #runtime: Runtime;

  constructor({
    action,
    request,
    runtime,
  }: {
    action: CompiledAction;
    request: Request;
    runtime: Runtime;
  }) {
    this.#action = action;
    this.#request = request;
    this.#runtime = runtime;
  }

  async rscResponse() {
    let result = await this.runAction();

    let url = new URL(this.#request.url);
    let requestUrl = new URL(this.path, url);
    let requestToRender = new Request(requestUrl, {
      ...this.#request,
      headers: this.#request.headers,
      method: "GET",
      body: null,
    });

    if (isNotFoundError(result)) {
      return this.notFoundResponse();
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
        return this.notFoundResponse();
      } else if (isRedirectError(err)) {
        let { url } = redirectErrorInfo(err);
        return this.redirectResponse(url);
      } else {
        throw err;
      }
    }

    // ugh
    // need to add page assets to store

    let reactTree = await pageRequest.reactTree();

    let { stream, error, redirect, notFound } =
      await this.#runtime.renderRSCStream({
        render: reactTree,
        action: result,
      });

    if (notFound) {
      stream.cancel();
      return this.notFoundResponse();
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

  private async runAction() {
    let actionUrl = pathToFileURL(this.#action.path);
    let module = await import(actionUrl.href);
    let fn = module[this.#action.export];
    let args = await this.args();

    let result;
    try {
      result = await fn(...args);
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

  private get path() {
    let url = new URL(this.#request.url);
    let path = url.searchParams.get("path");

    if (!path) {
      throw new Error("No path specified");
    }

    return path;
  }

  private async args() {
    let request = this.#request;

    let args = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (contentType.value === "text/plain") {
      let text = await request.text();
      args = await decodeReply(text);
    } else if (contentType.value === "multipart/form-data") {
      let formData = await request.formData();
      args = await decodeReply(formData);
    }

    return args;
  }

  get name() {
    let [, name] = this.#action.id.split("#");
    if (name.startsWith("tf$serverFunction$")) {
      let parts = name.split("$");
      name = parts[3];
    }

    return name;
  }

  private get requestToRender() {
    let url = new URL(this.#request.url);
    let requestUrl = new URL(this.path, url);
    let requestToRender = new Request(requestUrl, {
      ...this.#request,
      headers: this.#request.headers,
      method: "GET",
      body: null,
    });

    return requestToRender;
  }

  private notFoundResponse() {
    let pageRequest = this.#runtime.notFoundPageRequest(this.requestToRender);
    return pageRequest.rscResponse();
  }

  private redirectResponse(url: string) {
    let requestUrl = new URL(this.path, url);
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
