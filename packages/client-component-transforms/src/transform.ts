import { transform as esbuildTransform } from "esbuild";
import { transformAsync } from "@babel/core";
import { TransformPlugin } from "./plugins/transform-plugin.js";
import dedent from "dedent";

type TransformOptions = {
  input: {
    code: string;
    language: "js" | "jsx" | "ts" | "tsx";
  };
  moduleId: string;
};

export async function transform({ input, moduleId }: TransformOptions) {
  let esResult = await esbuildTransform(input.code, {
    loader: input.language,
    jsx: "automatic",
    format: "esm",
  });

  let codeAst = await transformAsync(esResult.code, {
    plugins: [
      [
        TransformPlugin,
        {
          moduleId,
        },
      ],
    ],
    ast: false,
    code: false,
  });

  let clientComponents: string[] =
    codeAst?.metadata &&
    "clientComponents" in codeAst.metadata &&
    codeAst.metadata.clientComponents instanceof Set
      ? Array.from(codeAst.metadata.clientComponents)
      : [];

  if (clientComponents.length === 0) {
    return {
      clientComponents: [],
      code: esResult.code,
    };
  }

  let exports = clientComponents.map((name) => {
    if (name === "default") {
      return `export default proxy['default'];`;
    } else {
      return `export const ${name} = proxy['${name}'];`;
    }
  });

  let newCode = dedent`
    import { createClientModuleProxy } from "react-server-dom-webpack/server.edge";
    let proxy = createClientModuleProxy("${moduleId}");

    ${exports.join("\n")}
  `;

  return {
    code: newCode,
    clientComponents,
  };
}
