import { RouteHandler } from "@hattip/router";
import { pathToFileURL } from "node:url";
import { SerializeOptions } from "cookie";

type MiddlewareContext = {
  setCookie(name: string, value: string, options?: SerializeOptions): void;
};

export function globalMiddleware(): RouteHandler {
  return async (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let hasMiddleware = ctx.runtime.buildResult.outputs.rsc.hasMiddleware();
    if (hasMiddleware) {
      let middlewarePath = ctx.runtime.buildResult.outputs.rsc.middlewarePath;
      let module = await import(pathToFileURL(middlewarePath).href);
      let context: MiddlewareContext = {
        setCookie(name, value, options) {
          ctx.setCookie(name, value, { path: "/", ...options });
        },
      };
      let ans = await module.default(ctx.request, context);
      return ans;
    }
  };
}
