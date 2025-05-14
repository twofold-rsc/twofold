import { Plugin } from "esbuild";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { readFile } from "fs/promises";
import { getModuleId } from "../helpers/module.js";
import { extname } from "path";
import { z } from "zod";
import { transform as clientComponentTransform } from "@twofold/client-component-transforms";

let languageSchema = z.union([
  z.literal("ts"),
  z.literal("tsx"),
  z.literal("js"),
  z.literal("jsx"),
]);

export function clientComponentProxyPlugin({
  builder,
}: {
  builder: RSCBuilder;
}) {
  let plugin: Plugin = {
    name: "client-component-proxy-plugin",

    setup(build) {
      build.initialOptions.metafile = true;

      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let contents = await readFile(path, "utf-8");
        let hasUseClient = contents.includes("use client");

        if (hasUseClient) {
          console.log("Client component detected:", path);

          let moduleId = getModuleId(path);
          let extension = extname(path).slice(1);
          let language = languageSchema.parse(extension);

          let transformed = await clientComponentTransform({
            input: {
              code: contents,
              language,
            },
            moduleId,
          });

          // we also need to cache the exports somewhere?

          return {
            contents: transformed.code,
            loader: "js",
          };
        }
      });
    },
  };

  return plugin;
}
