import { RouteHandler } from "@hattip/router";
import { serializeError } from "serialize-error";
import { readFile } from "fs/promises";
import { appCompiledDir } from "../../files.js";
import { parseHeaderValue } from "@hattip/headers";
import type { Runtime } from "../../runtime.js";

export function errors(runtime: Runtime): RouteHandler {
  let build = runtime.build;

  return async (ctx) => {
    let requestBuildKey = build.key;

    ctx.handleError = async (e: unknown) => {
      let request = ctx.request;

      let accepts = parseHeaderValue(request.headers.get("accept"));
      let isRSCFetch = accepts.some((a) => a.value === "text/x-component");
      let isHTMLFetch = accepts.some((a) => a.value === "text/html");

      let error = e instanceof Error ? e : new Error("Internal server error");

      let status =
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest === "TwofoldNotFoundError"
          ? 404
          : 500;

      if (isRSCFetch) {
        let stream = runtime.createFlightStream({
          stack: [
            {
              type: "error",
              error: error,
            },
          ],
        });

        return new Response(stream, {
          status,
          headers: {
            "content-type": "text/x-component",
          },
        });
      } else if (isHTMLFetch) {
        let html = await errorPage({ error, buildKey: requestBuildKey });
        return new Response(html, {
          status,
          headers: {
            "content-type": "text/html",
          },
        });
      } else {
        let text = `${error.message}\n\n${error.stack}`;
        return new Response(text, {
          status,
          headers: {
            "content-type": "text/plain",
          },
        });
      }
    };

    if (build.name === "development") {
      let request = ctx.request;
      let url = new URL(request.url);

      if (
        request.method === "GET" &&
        url.pathname === "/_twofold/errors/app.js"
      ) {
        let contents = await build.getBuilder("dev-error-page").js();
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
        let contents = await build.getBuilder("dev-error-page").css();
        return new Response(contents, {
          headers: {
            "content-type": "text/css",
          },
        });
      }
    }

    if (build.error) {
      throw build.error;
    }
  };
}

async function errorPage({
  error,
  buildKey,
}: {
  error: Error;
  buildKey: string;
}) {
  let htmlFile = new URL("./server-files/error.html", appCompiledDir);
  let contents = await readFile(htmlFile, "utf-8");

  let isProd = process.env.NODE_ENV === "production";

  let serializedError = isProd ? "" : JSON.stringify(serializeError(error));
  let message = isProd ? "" : error.message;
  let stack = isProd ? "" : (error.stack ?? "");

  let digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  let html = contents
    .replace("$build-key", buildKey)
    .replace("$error", serializedError)
    .replace("$message", message)
    .replace("$stack", stack)
    .replace("$digest", digest);

  return html;
}
