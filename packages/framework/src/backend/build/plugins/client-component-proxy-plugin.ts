import { Plugin } from "esbuild";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { readFile } from "fs/promises";
import { getModuleId } from "../helpers/module.js";
import { transform as clientComponentTransform } from "@twofold/client-component-transforms";
import { pathToLanguage } from "../helpers/languages.js";
import { shouldIgnoreUseClient } from "../helpers/excluded.js";

export function clientComponentProxyPlugin({
  builder,
}: {
  builder: RSCBuilder;
}) {
  let plugin: Plugin = {
    name: "client-component-proxy-plugin",

    setup(build) {
      build.initialOptions.metafile = true;

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseClient(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");
        let hasUseClient = contents.includes("use client");

        if (hasUseClient) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);

          let transformed = await clientComponentTransform({
            input: {
              code: contents,
              language,
            },
            moduleId,
            rscClientPath: "react-server-dom-webpack/server.edge",
          });

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
