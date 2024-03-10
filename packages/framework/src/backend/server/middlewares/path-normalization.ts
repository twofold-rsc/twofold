import { RouteHandler } from "@hattip/router";

export function pathNormalization(): RouteHandler {
  return async (ctx) => {
    let url = new URL(ctx.request.url);
    if (url.pathname.endsWith("/") && url.pathname !== "/") {
      return new Response(null, {
        status: 307,
        headers: {
          Location: url.pathname.slice(0, -1),
        },
      });
    }
  };
}
