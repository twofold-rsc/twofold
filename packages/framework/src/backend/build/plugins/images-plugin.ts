import { Plugin } from "esbuild";
import path from "path";
import * as mime from "mime-types";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { hashFile } from "../helpers/file.js";

export type Image = {
  id: string;
  type: string;
  path: string;
};

export function imagesPlugin({
  builder,
  prefixPath,
}: {
  builder: RSCBuilder;
  prefixPath: string;
}): Plugin {
  return {
    name: "images",
    async setup(build) {
      build.onLoad(
        { filter: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/ },
        async (args) => {
          let ext = path.extname(args.path);
          let name = path.basename(args.path, ext);
          let hash = await hashFile(args.path);
          let id = `${name}-${hash}${ext}`;
          let type = mime.contentType(ext) || "";
          let publicUrl = `${prefixPath}/${id}`;

          builder.imagesMap.set(args.path, {
            id,
            type,
            path: args.path,
          });

          return {
            contents: `export default ${JSON.stringify(publicUrl)};`,
            loader: "js",
          };
        },
      );
    },
  };
}
