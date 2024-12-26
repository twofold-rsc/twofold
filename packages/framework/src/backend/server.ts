import "./monkey-patch.js";
import { createServer } from "@hattip/adapter-node/native-fetch";
import { parseHeaderValue } from "@hattip/headers";
import { createRouter } from "@hattip/router";
import {
  renderToReadableStream,
  decodeReply,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/server.edge'.
} from "react-server-dom-webpack/server.edge";
import { getStore } from "./stores/rsc-store.js";
import { cookie } from "@hattip/cookie";
import { MultipartResponse } from "./multipart-response.js";
import { devReload } from "./server/middlewares/dev-reload.js";
import { errors } from "./server/middlewares/errors.js";
import { staticFiles } from "./server/middlewares/static-files.js";
import { assets } from "./server/middlewares/assets.js";
import { pathNormalization } from "./server/middlewares/path-normalization.js";
import { globalMiddleware } from "./server/middlewares/global-middleware.js";
import { requestStore } from "./server/middlewares/request-store.js";
import { waitForBuild } from "./server/middlewares/wait-for-build.js";
import { waitForSSR } from "./server/middlewares/wait-for-ssr-worker.js";
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./runtime/helpers/errors.js";
import { Server as NodeHttpServer } from "http";
import { Runtime } from "./runtime.js";

async function createHandler(runtime: Runtime) {
  let build = runtime.build;

  let app = createRouter();

  app.use(pathNormalization());

  app.use(cookie());

  app.use(waitForBuild(runtime));

  app.use(globalMiddleware(build));
  app.use(assets(build));
  app.use(staticFiles(build));

  if (build.canReload) {
    app.use(devReload(build));
  }

  app.use(errors(build));

  // every request below here should use the store
  app.use(requestStore(runtime));

  app.get("/__rsc/page", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.rscResponse();

    let initiator = ctx.request.headers.get("x-twofold-initiator");

    if (response.status === 404) {
      console.log("🔴 Not found", requestUrl.pathname);
    } else if (response.status === 307) {
      let location = response.headers.get("location")?.split("?")[1];
      let params = new URLSearchParams(location ?? "");
      console.log("🔵 Redirecting to", params.get("path"));
    } else if (initiator === "refresh") {
      console.log("🔵 Refreshing", requestUrl.pathname);
    } else if (initiator === "client-side-navigation") {
      console.log("🟢 Rendering", requestUrl.pathname);
    }

    return response;
  });

  app.get("/__rsc/not-found", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = runtime.notFoundPageRequest(request);
    let response = await pageRequest.rscResponse();

    return response;
  });

  app.post("/__rsc/action/:id", async (ctx) => {
    // this whole function should be moved into the runtime, but im going to leave it here for now
    let request = ctx.request;
    let params = ctx.params as Record<string, unknown>;

    if (!params.id || typeof params.id !== "string") {
      throw new Error("No server action specified");
    }

    let id = decodeURIComponent(params.id);

    let url = new URL(request.url);
    let path = url.searchParams.get("path");

    if (!path) {
      throw new Error("No path specified");
    }

    let args = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (contentType.value === "text/plain") {
      let text = await request.text();
      args = await decodeReply(text);
    } else if (contentType.value === "multipart/form-data") {
      let formData = await request.formData();
      args = await decodeReply(formData);
    }

    let actionFn = await runtime.getAction(id);

    let [, name] = id.split("#");
    if (name.startsWith("tf$serverFunction$")) {
      let parts = name.split("$");
      name = parts[3];
    }
    console.log(`🟣 Running action ${name}`);

    let result;
    try {
      result = await actionFn(...args);
    } catch (err: unknown) {
      if (isNotFoundError(err) || isRedirectError(err)) {
        result = err;
      } else {
        // rethrow
        throw err;
      }
    }

    // action is done running, get any cookies it set back into
    // the store
    let store = getStore();
    if (store) {
      store.cookies.outgoingCookies = ctx.outgoingCookies;
    }

    // meh
    let requestUrl = new URL(path, url);
    let requestToRender = new Request(requestUrl, {
      ...ctx.request,
      method: "GET",
      body: null,
    });

    if (isNotFoundError(result)) {
      console.log(`🔴 Action ${name} called notFound`);
      let pageRequest = runtime.notFoundPageRequest(requestToRender);
      return pageRequest.rscResponse();
    }

    if (isRedirectError(result)) {
      let { url } = redirectErrorInfo(result);
      let redirectUrl = new URL(url, request.url);
      let isRelative =
        redirectUrl.origin === requestUrl.origin && url.startsWith("/");

      if (isRelative) {
        let redirectRequest = new Request(redirectUrl, requestToRender);
        let redirectPageRequest = runtime.pageRequest(redirectRequest);

        let encodedPath = encodeURIComponent(redirectUrl.pathname);
        let resource = redirectPageRequest.isNotFound ? "not-found" : "page";
        let newUrl = `/__rsc/${resource}?path=${encodedPath}`;

        console.log("🔵 Redirecting to", redirectUrl.pathname);

        return new Response(null, {
          status: 303,
          headers: {
            location: newUrl,
          },
        });
      }

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

    let actionStream = renderToReadableStream(
      result,
      build.getBuilder("client").clientComponentMap,
    );

    let multipart = new MultipartResponse();

    multipart.add({
      type: "text/x-action",
      body: actionStream,
      headers: {
        "x-twofold-stream": "action",
        "x-twofold-server-reference": id,
      },
    });

    let pageRequest = runtime.pageRequest(requestToRender);
    let pageResponse = await pageRequest.rscResponse();

    multipart.add({
      type: "text/x-component",
      body: pageResponse.body,
      headers: {
        "x-twofold-stream": "render",
        "x-twofold-path": path,
      },
    });

    return multipart.response();
  });

  app.use(waitForSSR(runtime));

  app.use("/**/*", async (ctx) => {
    let request = ctx.request;
    let requestUrl = new URL(request.url);

    let apiRequest = runtime.apiRequest(request);
    if (apiRequest) {
      let pageRequest = runtime.pageRequest(request);

      let pageExists = !pageRequest.isNotFound;
      let accepts = parseHeaderValue(request.headers.get("accept"));
      let acceptsHTML = accepts.some((a) => a.value === "text/html");
      let skipAPI = pageExists && acceptsHTML;

      if (!skipAPI) {
        let response = await apiRequest.response();

        if (response.status === 404) {
          console.log("🔴 Not found", requestUrl.pathname);
        } else if (response.status === 307 || response.status === 308) {
          let location = response.headers.get("location");
          console.log("🔵 Redirecting to", location);
        } else {
          let method = request.method.toUpperCase();
          console.log(`🟢 API ${method}`, requestUrl.pathname);
        }

        return response;
      }
    }
  });

  app.get("/**/*", async (ctx) => {
    let url = new URL(ctx.request.url);
    let request = ctx.request;

    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.ssrResponse();

    if (response.status === 404) {
      console.log("🔴 Not found", url.pathname);
    } else if (response.status === 307 || response.status === 308) {
      console.log("🔵 Redirecting to", response.headers.get("location"));
    } else {
      console.log("🟢 Serving", url.pathname);
    }

    return response;
  });

  return app.buildHandler();
}

export class Server {
  #runtime: Runtime;
  #server?: NodeHttpServer;

  constructor(runtime: Runtime) {
    this.#runtime = runtime;
  }

  private get build() {
    return this.#runtime.build;
  }

  private get runtime() {
    return this.#runtime;
  }

  async start() {
    if (!this.#server) {
      let runtime = this.runtime;
      let handler = await createHandler(runtime);
      let config = await this.build.getAppConfig();

      let server = createServer(handler, {
        trustProxy: config.trustProxy ?? false,
      });

      this.#server = server;

      return new Promise<void>((resolve) => {
        server.listen(runtime.port, runtime.hostname, () => {
          resolve();
        });
      });
    }
  }

  async stop() {
    return new Promise<void>((resolve) => {
      let server = this.#server;

      if (server) {
        server.close(() => {
          this.#server = undefined;
          resolve();
        });
        server.closeAllConnections();
      } else {
        resolve();
      }
    });
  }
}
