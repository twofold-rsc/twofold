import { Plugin } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";
import xxhash from "xxhash-wasm";
import * as mime from "mime-types";
import { ClientAppBuilder } from "../builders/client-app-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";

export type Image = {
  id: string;
  type: string;
  path: string;
};

export function imagesPlugin({
  builder,
  prefixPath,
}: {
  builder: RSCBuilder | ClientAppBuilder;
  prefixPath: string;
}): Plugin {
  return {
    name: "images",
    async setup(build) {
      const { h32Raw } = await xxhash();

      build.onLoad(
        { filter: /\.(png|jpg|jpeg|gif|webp|svg)$/ },
        async (args) => {
          let contents = await readFile(args.path);
          let ext = path.extname(args.path);
          let name = path.basename(args.path, ext);
          let hash = h32Raw(contents);
          let id = `${name}-${hash}${ext}`;
          let type = mime.contentType(ext) || "";
          let publicUrl = `${prefixPath}/${id}`;

          builder.imagesMap.set(id, {
            id,
            type,
            path: args.path,
          });

          return {
            contents: `export default ${JSON.stringify(publicUrl)};`,
            loader: "js",
          };
        }
      );
    },
  };
}
