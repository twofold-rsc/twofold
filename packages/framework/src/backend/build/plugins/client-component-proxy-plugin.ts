import { Plugin } from "esbuild";
import { RSCBuilder } from "../rsc-builder";

export function clientComponentProxyPlugin({
  builder,
}: {
  builder: RSCBuilder;
}) {
  let plugin: Plugin = {
    name: "client-component-proxy-plugin",

    setup(build) {
      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let clientComponentModule =
          builder.entries.clientComponentModuleMap.get(path);

        if (clientComponentModule) {
          // re-export using the proxy
          let exportLines = clientComponentModule.exports.map((name) => {
            if (name === "default") {
              return `export default proxy['default'];`;
            } else {
              return `export const ${name} = proxy['${name}'];`;
            }
          });

          // RSC "safe" version of the client component
          let newContents = `
            import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
            let proxy = createClientModuleProxy("${clientComponentModule.moduleId}");

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
