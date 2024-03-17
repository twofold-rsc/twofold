import { Plugin } from "esbuild";
import { EntriesBuilder } from "../entries-builder";

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

          // CC "safe" version of the server action
          // relies on the router setting up window.__twofold.callServer, there might be a
          // better way to do this.
          let newContents = `
            import { createServerReference } from "react-server-dom-webpack/client";

            function callServer(...args) {
              if (typeof window !== 'undefined' && window.__twofold && window.__twofold.callServer) {
                return window.__twofold.callServer(...args);
              } else {
                throw new Error("Could not find callServer");
              }
            }

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
