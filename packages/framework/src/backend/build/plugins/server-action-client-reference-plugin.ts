import { Plugin } from "esbuild";
import { EntriesBuilder } from "../builders/entries-builder";
import { frameworkSrcDir } from "../../files.js";
import { fileURLToPath } from "url";
import { relative, dirname, sep } from "path";

type Builder = {
  entries: EntriesBuilder;
};

// this plugin lets client components import server actions

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
        let serverActionModule =
          builder.entries.serverActionModuleMap.get(path);

        if (serverActionModule) {
          let { moduleId } = serverActionModule;
          // re-export using the reference function
          let exportLines = serverActionModule.exports.map((name) => {
            if (name === "default") {
              return `export default createServerReference("${moduleId}#default", callServer);`;
            } else {
              return `export const ${name} = createServerReference("${moduleId}#${name}", callServer);`;
            }
          });

          let dir = dirname(path);
          let relativeCallServerPath = relative(dir, callServerPath);
          let callServerImportPath = relativeCallServerPath.split(sep).join('/')

          let newContents = `
            import { createServerReference } from "react-server-dom-webpack/client";
            import { callServer } from "${callServerImportPath}";

            ${exportLines.join("\n")}
          `;

          return {
            contents: newContents,
            loader: "js",
          };
        }
      });
    },
  };

  return plugin;
}
