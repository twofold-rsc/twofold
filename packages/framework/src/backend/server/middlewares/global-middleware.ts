import { RouteHandler } from "@hattip/router";
import { Build } from "../../build/base-build";
import { pathToFileURL } from "node:url";

export function globalMiddleware(build: Build): RouteHandler {
  return async (ctx) => {
    if (!build.error) {
      let hasMiddleware = await build.getBuilder("rsc").hasMiddleware();
      if (hasMiddleware) {
        let middlewarePath = build.getBuilder("rsc").middlewarePath
        let module = await import(pathToFileURL(middlewarePath).href);
        let ans = await module.default(ctx.request);
        return ans;
      }
    }
  };
}
