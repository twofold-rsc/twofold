import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import type { RouteHandler } from "@hattip/router";
import path from "node:path";
import type { Runtime } from "../../runtime.js";

export function staticFiles(): RouteHandler {
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
      let outputs = ctx.runtime.buildResult.outputs;
      let read = createFileReader(
        new URL("./public/", outputs.entries.sourceRoot),
      );

      handler = createStaticMiddleware(
        outputs.staticFiles.fileMap,
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
