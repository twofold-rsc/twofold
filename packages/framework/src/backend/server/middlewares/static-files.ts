import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import type { RouteHandler } from "@hattip/router";
import path from "node:path";
import { cwdUrl } from "../../files.js";
import type { Runtime } from "../../runtime.js";

export function staticFiles(): RouteHandler {
  let root = new URL("./public", cwdUrl);
  let read = createFileReader(root);

  let handlers = new WeakMap<
    Runtime,
    ReturnType<typeof createStaticMiddleware>
  >();

  return (ctx) => {
    if (!ctx.runtime) {
      return;
    }

    let handler = handlers.get(ctx.runtime);

    if (!handler) {
      handler = createStaticMiddleware(
        ctx.runtime.buildResult.outputs.staticFiles.fileMap,
        read,
        {
          setHeaders(_ctx, headers, file) {
            headers.set(
              "Content-Disposition",
              `inline; filename=${path.basename(file.path)}`,
            );
          },
        },
      );

      handlers.set(ctx.runtime, handler);
    }

    return handler(ctx);
  };
}
