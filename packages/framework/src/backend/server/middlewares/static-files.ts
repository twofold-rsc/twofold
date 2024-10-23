import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import { cwdUrl } from "../../files.js";
import path from "node:path";
import { Environment } from "../../build/environments/environment";

export function staticFiles(environment: Environment) {
  let root = new URL("./public", cwdUrl);
  let read = createFileReader(root);
  return createStaticMiddleware(
    environment.getBuilder("static-files").fileMap,
    read,
    {
      setHeaders(ctx, headers, file) {
        headers.set(
          "Content-Disposition",
          `inline; filename=${path.basename(file.path)}`
        );
      },
    }
  );
}
