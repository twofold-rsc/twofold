import { RouteHandler } from "@hattip/router";
import { Build } from "../../build/base-build";

export function globalMiddleware(build: Build): RouteHandler {
  return async (ctx) => {
    if (!build.error) {
      let hasMiddleware = await build.getBuilder("rsc").hasMiddleware();
      if (hasMiddleware) {
        let module = await import(build.getBuilder("rsc").middlewarePath);
        let ans = await module.default(ctx.request);
        return ans;
      }
    }
  };
}
