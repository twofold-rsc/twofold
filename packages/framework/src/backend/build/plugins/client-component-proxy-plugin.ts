import { Plugin, transform } from "esbuild";
import { RSCBuilder } from "../rsc-builder";
import { readFile } from "fs/promises";
import { createHash } from "crypto";
import { basename, extname } from "path";
import { parseAsync } from "@babel/core";

export function clientComponentProxyPlugin({
  builder,
}: {
  builder: RSCBuilder;
}) {
  let plugin: Plugin = {
    name: "client-component-proxy-plugin",
    setup(build) {
      build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async ({ path }) => {
        let contents = await readFile(path, "utf-8");
        let isClient = contents.startsWith('"use client";\n');

        if (isClient) {
          let md5 = createHash("md5").update(contents).digest("hex");
          let name = basename(path, extname(path));
          let moduleId = `${name}-${md5}`;

          // parse contents
          let { code } = await transform(contents, {
            loader: "tsx",
            jsx: "automatic",
            format: "esm",
          });

          let ast = await parseAsync(code);

          // find all exports
          let exports =
            ast?.program.body.reduce<string[]>((exports, node) => {
              if (node.type === "ExportNamedDeclaration") {
                return [
                  ...exports,
                  ...node.specifiers.map((specifier) =>
                    specifier.exported.type === "Identifier"
                      ? specifier.exported.name
                      : specifier.exported.value,
                  ),
                ];
              } else if (node.type === "ExportDefaultDeclaration") {
                return [...exports, "default"];
              } else {
                return exports;
              }
            }, []) ?? [];

          // stash each export
          builder.clientComponents.add({
            moduleId,
            path,
            exports,
          });

          // re-export using the proxy
          let exportLines = exports.map((name) => {
            if (name === "default") {
              return `export default proxy['default'];`;
            } else {
              return `export const ${name} = proxy['${name}'];`;
            }
          });

          // RSC "safe" version of the client component
          let newContents = `
            import { createClientModuleProxy, registerClientReference } from "react-server-dom-webpack/server.edge";
            let proxy = createClientModuleProxy("${moduleId}");

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
