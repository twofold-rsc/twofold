import { RouteHandler } from "@hattip/router";
import { Server } from "../../server.js";

export function waitForServerState(server: Server): RouteHandler {
  return async (ctx) => {
    let state = await server.waitForServerState();
    ctx.runtime = state.status === "ready" ? state.runtime : undefined;
    ctx.buildFailure = state.status === "error" ? state.buildResult : undefined;
  };
}
