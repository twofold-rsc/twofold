import { Plugin } from "esbuild";
import path from "path";
import * as mime from "mime-types";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { cwdUrl } from "../../files.js";
import { fileURLToPath } from "url";
import { fileExists, hashFile } from "../helpers/file.js";

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
  async function addFont(fontFile: string) {
    let font = builder.fontsMap.get(fontFile);

    if (!font) {
      let ext = path.extname(fontFile);
      let name = path.basename(fontFile, ext);
      let hash = await hashFile(fontFile);
      let id = `${name}-${hash}${ext}`;
      let type = mime.contentType(ext) || "";

      font = {
        id,
        type,
        path: fontFile,
      };

      builder.fontsMap.set(fontFile, font);
    }

    return font;
  }

  return {
    name: "fonts",
    async setup(build) {
      let publicFolderUrl = new URL("./public/", cwdUrl);
      let publicFolderPath = fileURLToPath(publicFolderUrl);

      build.onResolve({ filter: /\.(woff2)$/ }, async (args) => {
        if (args.importer.endsWith(".css")) {
          // if a css file is asking for a font we add it to the map
          // and return an external
          if (args.path.startsWith("/")) {
            let potentialPublicFontUrl = new URL(
              `.${args.path}`,
              publicFolderUrl
            );

            let existsInPublic = await fileExists(potentialPublicFontUrl);
            let fontFile = existsInPublic
              ? fileURLToPath(potentialPublicFontUrl)
              : args.path;

            let font = await addFont(fontFile);
            return {
              external: true,
              path: `${prefixPath}/${font.id}`,
            };
          } else if (args.path.startsWith("./")) {
            let fontFile = path.join(path.dirname(args.importer), args.path);
            let font = await addFont(fontFile);
            return {
              external: true,
              path: `${prefixPath}/${font.id}`,
            };
          } else {
            throw new Error(
              `Unexpected font import path: ${args.path} in ${args.importer}`
            );
          }
        }
      });

      build.onLoad({ filter: /\.(woff2)$/ }, async (args) => {
        let font = await addFont(args.path);
        let publicUrl = `${prefixPath}/${font.id}`;

        return {
          contents: `export default ${JSON.stringify(publicUrl)};`,
          loader: "js",
        };
      });
    },
  };
}
