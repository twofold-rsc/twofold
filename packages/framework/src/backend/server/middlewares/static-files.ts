import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import { cwdUrl } from "../../files.js";
import path from "node:path";
import { Build } from "../../build/build/build.js";

export function staticFiles(build: Build) {
  let root = new URL("./public", cwdUrl);
  let read = createFileReader(root);
  return createStaticMiddleware(
    build.getBuilder("static-files").fileMap,
    read,
    {
      setHeaders(ctx, headers, file) {
        headers.set(
          "Content-Disposition",
          `inline; filename=${path.basename(file.path)}`,
        );
      },
    },
  );
}
