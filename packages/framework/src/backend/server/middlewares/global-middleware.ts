import { RouteHandler } from "@hattip/router";
import { Environment } from "../../build/environments/environment";
import { pathToFileURL } from "node:url";

export function globalMiddleware(build: Environment): RouteHandler {
  return async (ctx) => {
    if (!build.error) {
      let hasMiddleware = await build.getBuilder("rsc").hasMiddleware();
      if (hasMiddleware) {
        let middlewarePath = build.getBuilder("rsc").middlewarePath;
        let module = await import(pathToFileURL(middlewarePath).href);
        let ans = await module.default(ctx.request);
        return ans;
      }
    }
  };
}
