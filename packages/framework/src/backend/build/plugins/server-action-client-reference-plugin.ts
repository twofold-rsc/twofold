import { Plugin } from "esbuild";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { relative, dirname, sep } from "path";
import { readFile } from "fs/promises";
import { transform as serverFunctionTransform } from "@twofold/server-function-transforms";
import { getModuleId } from "../helpers/module.js";
import { pathToLanguage } from "../helpers/languages.js";
import { shouldIgnoreUseServer } from "../helpers/excluded.js";

// this plugin lets client components import server actions

type Builder = {
  entries: EntriesBuilder;
};

export function serverActionClientReferencePlugin({
  builder,
}: {
  builder: Builder;
}) {
  let plugin: Plugin = {
    name: "server-action-client-reference-plugin",

    setup(build) {
      let callServerUrl = new URL(
        "./client/apps/client/actions/call-server.ts",
        frameworkSrcDir
      );
      let callServerPath = fileURLToPath(callServerUrl);

      build.onLoad({ filter: /\.(ts|tsx|js|jsx|mjs)$/ }, async ({ path }) => {
        if (shouldIgnoreUseServer(path)) {
          return null;
        }

        let contents = await readFile(path, "utf-8");
        let hasUseServer = contents.includes("use server");

        if (hasUseServer) {
          let moduleId = getModuleId(path);
          let language = pathToLanguage(path);

          let dir = dirname(path);
          let relativeCallServerPath = relative(dir, callServerPath);
          let callServerImportPath = relativeCallServerPath
            .split(sep)
            .join("/")
            .replace(/\.ts$/, "");

          let transformed = await serverFunctionTransform({
            input: {
              code: contents,
              language,
            },
            moduleId,
            client: {
              callServerModule: callServerImportPath,
            },
          });

          let hasServerFunctions = transformed.serverFunctions.length > 0;
          return {
            contents: hasServerFunctions ? transformed.code : contents,
            loader: hasServerFunctions ? "js" : language,
          };
        }
      });
    },
  };

  return plugin;
}
