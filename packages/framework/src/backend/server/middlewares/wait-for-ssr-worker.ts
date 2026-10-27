import { RouteHandler } from "@hattip/router";
import { RuntimeStoppedError } from "../../runtime.js";

export function waitForSSR(): RouteHandler {
  return async (ctx) => {
    let runtime = ctx.runtime;

    if (!runtime) {
      return;
    }

    if (runtime.stopped) {
      throw new RuntimeStoppedError();
    }

    if (!runtime.hasSSRWorker) {
      throw new Error("SSR worker not available");
    }
  };
}
