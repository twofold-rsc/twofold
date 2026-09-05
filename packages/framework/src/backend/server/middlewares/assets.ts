import { RouteHandler, createRouter } from "@hattip/router";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
import { parseHeaderValue } from "@hattip/headers";

export function assets(): RouteHandler {
  let router = createRouter();

  let allowedMethods = ["GET", "HEAD"];

  router.use("/__tf/assets/**/*", async ({ request, runtime }) => {
    if (!runtime) {
      return;
    }

    const cacheControlHeader =
      runtime.buildResult.kind === "production"
        ? "public, max-age=31536000, immutable"
        : "no-store, no-cache, must-revalidate, proxy-revalidate";

    if (allowedMethods.includes(request.method)) {
      let { pathname } = new URL(request.url);
      let id = pathname.replace(/^\/__tf\/assets\//, "");
      let asset = runtime.buildResult.outputs.assets.assetMap.get(id);

      if (asset) {
        let encodings = parseHeaderValue(
          request.headers.get("accept-encoding"),
        );
        let acceptsBr = encodings.find((e) => e.value === "br");
        let file =
          acceptsBr && asset.brotliPath ? asset.brotliPath : asset.assetPath;

        let statResult = await stat(file);
        let contentStream = createReadStream(file);
        let webStream = Readable.toWeb(contentStream);

        let headers = new Headers({
          "Content-Type": asset.type,
          "Content-Length": statResult.size.toString(),
          "Cache-Control": cacheControlHeader,
        });

        if (acceptsBr && asset.brotliPath) {
          headers.set("Content-Encoding", "br");
          headers.set("Vary", "Accept-Encoding");
        }

        return new Response(webStream as ReadableStream, {
          headers,
        });
      }
    }
  });

  let handler = router.buildHandler();

  return async (ctx) => {
    let passThroughCalled = false;

    let subContext = {
      ...ctx,
      passThrough: async () => {
        passThroughCalled = true;
      },
    };

    let response = await handler(subContext);

    return response.status === 404 || passThroughCalled ? ctx.next() : response;
  };
}
