import { RouteHandler } from "@hattip/router";
import { Build } from "../../build";
import { shell } from "../../error-shell.js";
import { serializeError } from "serialize-error";
// import { parseHeaderValue } from "@hattip/headers";

export function errors(build: Build): RouteHandler {
  return async (ctx) => {
    ctx.handleError = (e: unknown) => {
      let request = ctx.request;
      let isRSCFetch = request.headers.get("accept") === "text/x-component";

      let error = e instanceof Error ? e : new Error("Internal server error");

      let status = error.message === "TwofoldNotFoundError" ? 404 : 500;

      if (isRSCFetch) {
        let text = JSON.stringify(serializeError(error));
        return new Response(text, {
          status,
          headers: {
            "content-type": "text/x-serialized-error",
          },
        });
      } else {
        let html = shell(error);
        return new Response(html, {
          status,
          headers: {
            "content-type": "text/html",
          },
        });
      }
    };

    let request = ctx.request;
    let url = new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/_twofold/errors/app.js"
    ) {
      let contents = await build.builders.error.js();
      return new Response(contents, {
        headers: {
          "content-type": "application/javascript",
        },
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/_twofold/errors/app.css"
    ) {
      let contents = await build.builders.error.css();
      return new Response(contents, {
        headers: {
          "content-type": "text/css",
        },
      });
    }

    if (build.error) {
      throw build.error;
    }
  };
}
