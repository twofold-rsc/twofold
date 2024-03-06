import { Plugin } from "esbuild";
import { RSCBuilder } from "../rsc-builder";

export function serverActionProxyPlugin({ builder }: { builder: RSCBuilder }) {
  let plugin: Plugin = {
    name: "server-action-proxy-plugin",

    setup(build) {
      let modulePathMap = builder.entries.serverActionModulePathMap;

      build.onStart(() => {
        modulePathMap = builder.entries.serverActionModulePathMap;
      });

      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let serverActionModule = modulePathMap.get(path);
        if (serverActionModule) {
          let { moduleId } = serverActionModule;
          // re-export using the reference function
          let exportLines = serverActionModule.exports.map((name) => {
            if (name === "default") {
              return `export default registerServerReference(() => {}, "${moduleId}", "default");`;
            } else {
              return `export const ${name} = registerServerReference(() => {}, "${moduleId}", "${name}");`;
            }
          });

          // RSC/CC "safe" version of the server action
          let newContents = `
            import { registerServerReference } from "react-server-dom-webpack/server.edge";

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
