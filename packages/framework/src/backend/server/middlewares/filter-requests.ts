import { RouteHandler } from "@hattip/router";

export function filterRequests(): RouteHandler {
  return async (ctx) => {
    let url = new URL(ctx.request.url);

    // chrome devtools
    if (url.pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
      return new Response(null, {
        status: 204,
      });
    }
  };
}
