import { Plugin } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";
import xxhash from "xxhash-wasm";
import * as mime from "mime-types";
import { ClientAppBuilder } from "../builders/client-app-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { cwdUrl } from "../../files.js";
import { fileURLToPath } from "url";
import { hashFile } from "../helpers/file.js";

export type Font = {
  id: string;
  type: string;
  path: string;
};

export function fontsPlugin({
  builder,
  prefixPath,
}: {
  builder: RSCBuilder;
  prefixPath: string;
}): Plugin {
  return {
    name: "fonts",
    async setup(build) {
      let { h32Raw } = await xxhash();
      let publicUrl = new URL("./public", cwdUrl);
      let publicPath = fileURLToPath(publicUrl);

      build.onResolve(
        { filter: /^\/fonts\/.*\.(woff|woff2|ttf|otf|eot)$/ },
        async (args) => {
          if (args.importer.endsWith(".css")) {
            // this is public font "url" referenced in a css file. we're
            // going to turn it into an asset
            let fontFile = path.join(publicPath, args.path);

            let ext = path.extname(fontFile);
            let name = path.basename(fontFile, ext);
            let hash = await hashFile(fontFile);

            let id = `${name}-${hash}${ext}`;
            let type = mime.contentType(ext) || "";
            let publicUrl = `${prefixPath}/${id}`;

            builder.fontsMap.set(id, {
              id,
              type,
              path: fontFile,
            });

            return {
              external: true,
              path: publicUrl,
            };
          }
        }
      );
    },
  };
}
