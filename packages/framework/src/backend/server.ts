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
import { filterRequests } from "./server/middlewares/filter-requests.js";
import { gzip } from "./server/middlewares/gzip.js";
import kleur from "kleur";
import { Socket } from "net";

async function createHandler(server: Server) {
  let runtime = server.runtime;
  let build = server.build;

  let app = createRouter();

  app.use(pathNormalization());

  app.use(cookie());

  app.use(waitForBuild(runtime));

  app.use(globalMiddleware(build));
  app.use(assets(build));
  app.use(gzip(build));
  app.use(staticFiles(build));

  app.use(filterRequests());

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
      log("Not found", requestUrl.pathname, "red");
    } else if (response.status === 307) {
      let location = response.headers.get("location")?.split("?")[1];
      let params = new URLSearchParams(location ?? "");
      log(
        "Redirect",
        `${requestUrl.pathname} redirected to ${params.get("path") ?? "unknown"}`,
        "cyan",
      );
    } else if (initiator === "refresh") {
      log("RSC Refresh", requestUrl.pathname, "green");
    } else if (initiator === "client-side-navigation") {
      log("Render", requestUrl.pathname, "green");
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
      log("Not found", "Unknown action", "red");
      return runtime.notFoundPageRequest(request).rscResponse();
    }

    let response = await actionRequest.rscResponse();
    let name = await actionRequest.name();

    if (response.status === 404) {
      log("Not found", `Action ${name}`, "red");
    } else if (response.status === 303) {
      let locationHeader = response.headers.get("location");
      let location = locationHeader?.startsWith("/__rsc/page?path=")
        ? decodeURIComponent(
            locationHeader.replace(/^\/__rsc\/page\?path=/, ""),
          )
        : locationHeader;

      log("Redirect", `Action ${name} redirected to ${location}`, "cyan");
    } else {
      log("Action", name, "magenta");
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
      let pageIsDynamic =
        pageRequest.page.isDynamic || pageRequest.page.isCatchAll;
      let apiIsDynamic = apiRequest.api.isDynamic || apiRequest.api.isCatchAll;
      let apiTakesPrecedence = !apiIsDynamic && pageIsDynamic;

      let skipAPI = pageExists && acceptsHTML && !apiTakesPrecedence;

      if (!skipAPI) {
        let response = await apiRequest.response();

        if (response.status === 404) {
          log("Not found", requestUrl.pathname, "red");
        } else if (response.status === 307 || response.status === 308) {
          let location = response.headers.get("location");
          log(
            "Redirect",
            `${requestUrl.pathname} redirected to ${location}`,
            "cyan",
          );
        } else {
          let method = request.method.toUpperCase();
          log(`API ${method}`, requestUrl.pathname, "green");
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
      let response = await actionRequest.ssrResponse();
      let name = await actionRequest.name();

      if (response.status === 404) {
        log("Not found", `Action ${name} rendered not found`, "red");
      } else if (response.status === 303) {
        let location = response.headers.get("location");
        log("Redirect", `Action ${name} redirected to ${location}`, "cyan");
      } else {
        log("Action", name, "magenta");
      }

      return response;
    }
  });

  app.head("/**/*", async (ctx) => {
    let request = ctx.request;
    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.rscResponse();

    let headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-type");

    return new Response(null, {
      status: response.status,
      headers,
    });
  });

  app.get("/**/*", async (ctx) => {
    let url = new URL(ctx.request.url);
    let request = ctx.request;

    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.ssrResponse();

    if (response.status === 404) {
      log("Not found", url.pathname, "red");
    } else if (response.status === 307 || response.status === 308) {
      let location = response.headers.get("location");
      log("Redirect", `${url.pathname} redirected to ${location}`, "cyan");
    } else {
      log("Serving", url.pathname, "green");
    }

    return response;
  });

  return app.buildHandler();
}

function log(
  label: string,
  info: string,
  color: "green" | "red" | "cyan" | "magenta",
) {
  console.log(`${kleur[color](`[${label}]`)} ${info}`);
}

export class Server {
  #runtime: Runtime;
  #server?: NodeHttpServer;
  #activeSockets?: Map<Socket, number>;

  constructor(runtime: Runtime) {
    this.#runtime = runtime;
  }

  get build() {
    return this.#runtime.build;
  }

  get runtime() {
    return this.#runtime;
  }

  async start() {
    if (!this.#server && !this.#activeSockets) {
      let runtime = this.runtime;
      let handler = await createHandler(this);
      let config = await this.build.getAppConfig();

      let server = createServer(handler, {
        trustProxy: config.trustProxy ?? false,
      });

      let activeSockets = new Map();

      server
        .on("connection", (socket) => {
          activeSockets.set(socket, 0);
          socket.on("close", () => activeSockets.delete(socket));
        })
        .on("request", (req, res) => {
          let socket = req.socket;
          activeSockets.set(socket, (activeSockets.get(socket) || 0) + 1);
          res.once("close", () => {
            const n = activeSockets.get(socket) || 0;
            if (n > 1) {
              activeSockets.set(socket, n - 1);
            } else {
              activeSockets.delete(socket);
            }
          });
        });

      this.#server = server;
      this.#activeSockets = activeSockets;

      return new Promise<void>((resolve) => {
        server.listen(runtime.port, runtime.hostname, () => {
          resolve();
        });
      });
    } else {
      throw new Error("Server is already running");
    }
  }

  async gracefulShutdown() {
    return new Promise<void>((resolve, reject) => {
      let server = this.#server;
      let activeSockets = this.#activeSockets;

      if (!server && !activeSockets) {
        resolve();
        return;
      }

      if (server && !server.listening) {
        reject(new Error("Shutdown called on a server that is not listening."));
        return;
      }

      if (!server || !activeSockets) {
        reject(new Error("Shutdown error: Server is in an invalid state."));
        return;
      }

      // max timeout so poll function can't run forever
      let continuePolling = true;
      const timeout = setTimeout(() => {
        continuePolling = false;
      }, 60_000);

      let poll = () => {
        if (!continuePolling) {
          console.log("polling timeout");
          reject(new Error("Shutdown error: Timed out."));
        } else if (server && !server.listening && activeSockets.size === 0) {
          console.log("shutdown complete");
          clearTimeout(timeout);
          this.#server = undefined;
          this.#activeSockets = undefined;
          server.removeAllListeners();
          resolve();
        } else if (server && !server.listening) {
          for (let [socket, count] of activeSockets) {
            if (count === 0) {
              console.log("destroying socket");
              socket.destroy();
            }
          }
          setImmediate(poll);
        } else {
          console.log("not ready");
          setTimeout(poll, 30);
        }
      };

      server.close((err) => {
        if (err) {
          console.log("rejecting close");
          reject(err);
        }
      });

      console.log("starting");
      poll();
    });
  }

  async hardStop() {
    return new Promise<void>((resolve, reject) => {
      let server = this.#server;
      let activeSockets = this.#activeSockets;

      if (!server && !activeSockets) {
        resolve();
        return;
      }

      if (server && !server.listening) {
        reject(new Error("Shutdown called on a server that is not listening."));
        return;
      }

      if (!server || !activeSockets) {
        reject(new Error("Shutdown error: Server is in an invalid state."));
        return;
      }

      server.close((err) => {
        this.#server = undefined;
        this.#activeSockets = undefined;
        server.removeAllListeners();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      for (let socket of activeSockets.keys()) {
        socket.destroy();
      }
      server.closeAllConnections();
    });
  }
}
