import { API } from "../build/rsc/api.js";
import { Runtime } from "../runtime.js";
import {
  isNotFoundError,
  isRedirectError,
  isUnauthorizedError,
  redirectErrorInfo,
} from "./helpers/errors.js";

export class APIRequest {
  #api: API;
  #request: Request;
  #runtime: Runtime;

  constructor({
    api,
    request,
    runtime,
  }: {
    api: API;
    request: Request;
    runtime: Runtime;
  }) {
    this.#api = api;
    this.#request = request;
    this.#runtime = runtime;
  }

  get method() {
    return this.#request.method.toUpperCase();
  }

  get api() {
    return this.#api;
  }

  async response() {
    let request = this.#request;
    let module = await this.#api.loadModule();

    if (module.before) {
      await module.before(this.props);
    }

    let method = request.method.toUpperCase();
    let response: Response;

    if (Object.hasOwn(module, method) && typeof module[method] === "function") {
      try {
        response = await module[method](this.props);
      } catch (error: unknown) {
        if (isNotFoundError(error)) {
          response = new Response("Not found", { status: 404 });
        } else if (isUnauthorizedError(error)) {
          response = new Response("Unauthorized", { status: 401 });
        } else if (isRedirectError(error)) {
          let { status, url } = redirectErrorInfo(error);
          response = new Response(null, {
            status,
            headers: {
              Location: url,
            },
          });
        } else {
          throw error;
        }
      }
    } else {
      response = new Response("Method not exported", { status: 404 });
    }

    return response;
  }

  private get props() {
    let url = new URL(this.#request.url);
    let execPattern = this.#api.pattern.exec(url);
    let params = execPattern?.pathname.groups ?? {};
    let searchParams = url.searchParams;
    let request = this.#request;

    return {
      params,
      searchParams,
      url,
      request,
    };
  }
}
