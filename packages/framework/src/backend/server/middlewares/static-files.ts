import { Build } from "../../build";
import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import { cwdUrl } from "../../files.js";
import path from "node:path";

export function staticFiles(build: Build) {
  let root = new URL("./public", cwdUrl);
  let read = createFileReader(root);
  return createStaticMiddleware(build.builders.static.fileMap, read, {
    setHeaders(ctx, headers, file) {
      headers.set(
        "Content-Disposition",
        `inline; filename=${path.basename(file.path)}`,
      );
    },
  });
}
