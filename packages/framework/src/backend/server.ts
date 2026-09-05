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
import { waitForSSR } from "./server/middlewares/wait-for-ssr-worker.js";
import { Server as NodeHttpServer } from "http";
import { Runtime } from "./runtime.js";
import { filterRequests } from "./server/middlewares/filter-requests.js";
import { gzip } from "./server/middlewares/gzip.js";
import kleur from "kleur";
import { Socket } from "net";
import { waitForServerState } from "./server/middlewares/wait-for-server-state.js";
import { Bus } from "./bus.js";
import { BuildFailure } from "./build/build-sessions/build-session.js";

type Options = {
  address: string;
  port: number;
  enableDevReload: boolean;
};

type PendingServerState = {
  status: "pending";
  generation: symbol;
  waitControl: PromiseWithResolvers<void>;
};

type InstalledServerState =
  | { status: "ready"; runtime: Runtime }
  | { status: "error"; buildResult: BuildFailure };

type ServerState = PendingServerState | InstalledServerState;

type ServerEvents = {
  serverStateInstalled: InstalledServerState;
};

export class Server {
  #address: string;
  #port: number;
  #enableDevReload: boolean;

  #server: NodeHttpServer | undefined;
  #activeSockets: Map<Socket, number> | undefined;
  #events = new Bus<ServerEvents>();

  #state: ServerState;

  constructor(options: Options) {
    this.#address = options.address;
    this.#port = options.port;
    this.#enableDevReload = options.enableDevReload;
    this.#state = {
      status: "pending",
      generation: Symbol(),
      waitControl: Promise.withResolvers<void>(),
    };
  }

  get baseUrl() {
    let domain = this.#address === "0.0.0.0" ? "localhost" : this.#address;
    return `http://${domain}:${this.#port}`;
  }

  get address() {
    return this.#address;
  }

  get port() {
    return this.#port;
  }

  get events() {
    return this.#events;
  }

  get enableDevReload() {
    return this.#enableDevReload;
  }

  async start({ trustProxy }: { trustProxy: boolean }) {
    if (!this.#server && !this.#activeSockets) {
      // let handler = await createHandler(this);

      let server = createServer(createHandler(this), {
        trustProxy,
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
        server.listen(this.#port, this.#address, () => {
          resolve();
        });
      });
    } else {
      throw new Error("Server is already running");
    }
  }

  createGeneration() {
    let generation = Symbol();
    let server = this;

    if (this.#state.status === "pending") {
      this.#state = {
        ...this.#state,
        generation,
      };
    } else {
      this.#state = {
        status: "pending",
        generation,
        waitControl: Promise.withResolvers<void>(),
      };
    }

    return {
      get canInstall() {
        let state = server.#state;
        return state.status === "pending" && state.generation === generation;
      },
      installRuntime: (runtime: Runtime) => {
        this.#install(generation, { status: "ready", runtime });
      },
      installBuildFailure: (buildResult: BuildFailure) => {
        this.#install(generation, { status: "error", buildResult });
      },
    };
  }

  #install(generation: symbol, state: InstalledServerState) {
    let currentState = this.#state;

    if (
      currentState.status !== "pending" ||
      currentState.generation !== generation
    ) {
      return;
    }

    this.#state = state;
    currentState.waitControl.resolve();
    this.#events.emit("serverStateInstalled", state);
  }

  async waitForServerState() {
    // needs loop because state could change after proimse resolves
    while (true) {
      let state = this.#state;
      if (state.status !== "pending") {
        return state;
      }

      await state.waitControl.promise;
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
          reject(new Error("Shutdown error: Timed out."));
        } else if (server && !server.listening && activeSockets.size === 0) {
          clearTimeout(timeout);
          this.#server = undefined;
          this.#activeSockets = undefined;
          server.removeAllListeners();
          resolve();
        } else if (server && !server.listening) {
          for (let [socket, count] of activeSockets) {
            if (count === 0) {
              socket.destroy();
            }
          }
          setImmediate(poll);
        } else {
          setTimeout(poll, 30);
        }
      };

      server.close((err) => {
        if (err) {
          reject(err);
        }
      });

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

export type BuildGeneration = ReturnType<Server["createGeneration"]>;

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    runtime?: Runtime | undefined;
    buildFailure?: BuildFailure | undefined;
  }
}

function createHandler(server: Server) {
  let app = createRouter();

  app.use(pathNormalization());

  app.use(cookie());

  app.use(waitForServerState(server));

  app.use(globalMiddleware());
  app.use(assets());
  app.use(gzip());
  app.use(staticFiles());

  app.use(filterRequests());

  if (server.enableDevReload) {
    app.use(devReload(server));
  }

  app.use(errors());

  // every request below here should use the store
  app.use(requestStore(server));

  app.get("/__rsc/page", async (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = ctx.runtime.pageRequest(request);
    let response = await pageRequest.rscResponse();

    let initiator = ctx.request.headers.get("x-twofold-initiator");

    if (response.status === 404) {
      log("Not found", requestUrl.pathname, "red");
    } else if (response.status === 401) {
      log("Unauthorized", requestUrl.pathname, "red");
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

  app.post("/__rsc/action/:id", async (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let request = ctx.request;

    let actionRequest = ctx.runtime.actionRequest(request);

    if (!actionRequest) {
      log("Not found", "Unknown action", "red");
      return ctx.runtime.notFoundPageRequest(request).rscResponse();
    }

    let response = await actionRequest.rscResponse();
    let name = await actionRequest.name();

    if (response.status === 404) {
      log("Not found", `Action ${name}`, "red");
    } else if (response.status === 401) {
      log("Unauthorized", `Action ${name}`, "red");
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

  app.use(waitForSSR());

  app.use("/**/*", async (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let request = ctx.request;
    let requestUrl = new URL(request.url);

    let apiRequest = ctx.runtime.apiRequest(request);
    if (apiRequest) {
      let pageRequest = ctx.runtime.pageRequest(request);

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
        } else if (response.status === 401) {
          log("Unauthorized", requestUrl.pathname, "red");
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
    if (!ctx.runtime) {
      return;
    }

    let request = ctx.request;

    let actionRequest = ctx.runtime.actionRequest(request);
    if (actionRequest) {
      let response = await actionRequest.ssrResponse();
      let name = await actionRequest.name();

      if (response.status === 404) {
        log("Not found", `Action ${name}`, "red");
      } else if (response.status === 401) {
        log("Unauthorized", `Action ${name}`, "red");
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
    if (!ctx.runtime) {
      return;
    }

    let request = ctx.request;
    let pageRequest = ctx.runtime.pageRequest(request);
    let response = await pageRequest.rscResponse();

    await response.body?.cancel();

    let headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-type");

    return new Response(null, {
      status: response.status,
      headers,
    });
  });

  app.get("/**/*", async (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let url = new URL(ctx.request.url);
    let request = ctx.request;

    let pageRequest = ctx.runtime.pageRequest(request);
    let response = await pageRequest.ssrResponse();

    if (response.status === 404) {
      log("Not found", url.pathname, "red");
    } else if (response.status === 401) {
      log("Unauthorized", url.pathname, "red");
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
