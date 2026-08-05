import { RouteHandler } from "@hattip/router";
import { Build } from "../../build/build/build.js";
import { pathToFileURL } from "node:url";
import { SerializeOptions } from "cookie";

type MiddlewareContext = {
  setCookie(name: string, value: string, options?: SerializeOptions): void;
};

export function globalMiddleware(build: Build): RouteHandler {
  return async (ctx) => {
    if (!build.error) {
      let hasMiddleware = await build.getBuilder("rsc").hasMiddleware();
      if (hasMiddleware) {
        let middlewarePath = build.getBuilder("rsc").middlewarePath;
        let module = await import(pathToFileURL(middlewarePath).href);
        let context: MiddlewareContext = {
          setCookie(name, value, options) {
            ctx.setCookie(name, value, { path: "/", ...options });
          },
        };
        let ans = await module.default(ctx.request, context);
        return ans;
      }
    }
  };
}
