import "./monkey-patch.js";
import { createServer } from "@hattip/adapter-node/native-fetch";
import { parseHeaderValue } from "@hattip/headers";
import { createRouter } from "@hattip/router";
import { cookie } from "@hattip/cookie";
import { devReload } from "./server/middlewares/dev-reload.js";
import { errors } from "./server/middlewares/errors.js";
import { staticFiles } from "./server/middlewares/static-files.js";
import { assets } from "./server/middlewares/assets.js";
import { pathNormalization } from "./server/middlewares/path-normalization.js";
import { globalMiddleware } from "./server/middlewares/global-middleware.js";
import { requestStore } from "./server/middlewares/request-store.js";
import { waitForBuild } from "./server/middlewares/wait-for-build.js";
import { waitForSSR } from "./server/middlewares/wait-for-ssr-worker.js";
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
    let request = ctx.request;

    let actionRequest = runtime.actionRequest(request);

    if (!actionRequest) {
      console.log(`🔴 Action not found`);
      return runtime.notFoundPageRequest(request).rscResponse();
    }

    let response = await actionRequest.rscResponse();
    let name = await actionRequest.name();

    if (response.status === 404) {
      console.log(`🔴 Action ${name} rendered not found`);
    } else if (response.status === 303) {
      let locationHeader = response.headers.get("location");
      let location = locationHeader?.startsWith("/__rsc/page?path=")
        ? decodeURIComponent(
            locationHeader.replace(/^\/__rsc\/page\?path=/, ""),
          )
        : locationHeader;

      console.log(`🔵 Action ${name} redirect to ${location}`);
    } else {
      console.log(`🟣 Ran action ${name}`);
    }

    return response;
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

  // mpa actions
  app.post("/**/*", async (ctx) => {
    let request = ctx.request;

    let actionRequest = runtime.actionRequest(request);
    if (actionRequest) {
      // let response;
      // let name;
      // try {
      //   response = await actionRequest.ssrResponse();
      //   name = await actionRequest.name();
      // } catch (e) {
      //   console.error(e);
      // }

      let response = await actionRequest.ssrResponse();
      let name = await actionRequest.name();

      if (response.status === 404) {
        console.log(`🔴 Action ${name} rendered not found`);
      } else if (response.status === 303) {
        let location = response.headers.get("location");
        console.log(`🔵 Action ${name} redirect to ${location}`);
      } else {
        console.log(`🟣 Ran action ${name}`);
      }

      return response;
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
