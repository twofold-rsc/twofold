import { RouteHandler } from "@hattip/router";
import { Build } from "../../build";

export function globalMiddleware(build: Build): RouteHandler {
  return async (ctx) => {
    let hasMiddleware = await build.builders.rsc.hasMiddleware();
    if (hasMiddleware) {
      let module = await import(build.builders.rsc.middlewarePath);
      let ans = await module.default(ctx.request);
      return ans;
    }
  };
}
