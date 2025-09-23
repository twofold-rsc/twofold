import { RouteHandler } from "@hattip/router";
import { parseHeaderValue } from "@hattip/headers";
import { Build } from "../../build/build/build.js";
import { createGzip, constants as zlibConstants } from "node:zlib";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";

export function gzip(build: Build): RouteHandler {
  return async (ctx) => {
    let buildSupportsCompression = build.name === "production";

    let encodings = parseHeaderValue(
      ctx.request.headers.get("accept-encoding"),
    );
    let acceptsGzip = encodings.find((e) => e.value === "gzip");

    let methodIsGetOrHead =
      ctx.request.method === "GET" || ctx.request.method === "HEAD";

    if (acceptsGzip && methodIsGetOrHead && buildSupportsCompression) {
      let res = await ctx.next();

      if (!res.body) {
        return res;
      }

      if (res.status < 200 || res.status >= 300) {
        return res;
      }

      if (ctx.request.headers.get("range")) {
        return res;
      }

      let contentEncoding = res.headers.get("content-encoding");
      if (contentEncoding && contentEncoding !== "identity") {
        return res;
      }

      let contentType = res.headers.get("content-type");
      if (!shouldCompressContentType(contentType)) {
        return res;
      }

      let nodeStream = Readable.fromWeb(res.body as ReadableStream);
      let gzip = createGzip({
        level: 6,
        chunkSize: 4 * 1024,
        flush: zlibConstants.Z_SYNC_FLUSH,
      });

      let headers = new Headers(res.headers);
      headers.delete("Content-Length");
      headers.set("Content-Encoding", "gzip");
      headers.set("Vary", "Accept-Encoding");

      let etag = headers.get("etag");
      if (etag && !etag.startsWith("W/")) {
        headers.set("ETag", `W/${etag}`);
      }

      let compressedNodeStream = nodeStream.pipe(gzip);
      let compressedWebStream = Readable.toWeb(compressedNodeStream);

      return new Response(
        compressedWebStream as globalThis.ReadableStream<Uint8Array>,
        {
          status: res.status,
          statusText: res.statusText,
          headers,
        },
      );
    }
  };
}

function shouldCompressContentType(contentType: string | null) {
  if (!contentType) return false;

  const mediaType = contentType.split(";")[0].trim().toLowerCase();

  return (
    mediaType.startsWith("text/") ||
    mediaType === "application/json" ||
    mediaType === "application/javascript" ||
    mediaType === "application/xml" ||
    mediaType === "image/svg+xml" ||
    mediaType === "application/rss+xml" ||
    mediaType === "application/atom+xml"
  );
}
