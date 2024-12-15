import { Plugin } from "esbuild";
import { EntriesBuilder } from "../builders/entries-builder";
import { frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { relative, dirname, sep, extname } from "path";
import { readFile } from "fs/promises";
import { z } from "zod";
import { transform as serverFunctionTransform } from "@twofold/server-function-transforms";
import { getModuleId } from "../helpers/module.js";

// this plugin lets client components import server actions

type Builder = {
  entries: EntriesBuilder;
};

let languageSchema = z.union([
  z.literal("ts"),
  z.literal("tsx"),
  z.literal("js"),
  z.literal("jsx"),
]);

type Language = z.infer<typeof languageSchema>;

type Result = {
  contents: string;
  loader: Language;
};

// these files contain "use server", but not as directives. we can
// ignore them so we don't spend time parsing the ast.
let ignoreFiles: RegExp[] = [
  /react-server-dom-webpack-client\.edge\..*\.js/,
  /react-server-dom-webpack-client\.browser\..*\.js/,
];

export function serverActionClientReferencePlugin({
  builder,
}: {
  builder: Builder;
}) {
  let plugin: Plugin = {
    name: "server-action-client-reference-plugin",

    setup(build) {
      let callServerUrl = new URL(
        "./apps/client/actions/call-server.ts",
        frameworkSrcDir,
      );
      let callServerPath = fileURLToPath(callServerUrl);

      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let contents = await readFile(path, "utf-8");
        let hasUseServer = contents.includes("use server");
        let hasIgnore = ignoreFiles.some((ignore) => ignore.test(path));

        if (hasUseServer && !hasIgnore) {
          let moduleId = getModuleId(path);
          let extension = extname(path).slice(1);
          let language = languageSchema.parse(extension);

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
          let result: Result = hasServerFunctions
            ? {
                contents: transformed.code,
                loader: "js",
              }
            : {
                contents,
                loader: language,
              };

          return result;
        }
      });
    },
  };

  return plugin;
}
