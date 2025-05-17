import { transform as esbuildTransform } from "esbuild";
import { transformAsync } from "@babel/core";
import { TransformPlugin } from "./plugins/transform-plugin.js";
import dedent from "dedent";

type TransformOptions = {
  input: {
    code: string;
    language: "js" | "jsx" | "ts" | "tsx";
  };
  rscClientPath: string;
  moduleId: string;
};

export async function transform({
  input,
  moduleId,
  rscClientPath,
}: TransformOptions) {
  let esResult = await esbuildTransform(input.code, {
    loader: input.language,
    jsx: "automatic",
    format: "esm",
  });

  let result = await transformAsync(esResult.code, {
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

  let clientExports: string[] =
    result?.metadata &&
    "clientExports" in result.metadata &&
    result.metadata.clientExports instanceof Set
      ? Array.from(result.metadata.clientExports)
      : [];

  if (clientExports.length === 0) {
    return {
      clientExports: [],
      code: esResult.code,
    };
  }

  let exports = clientExports.map((name) => {
    if (name === "default") {
      return `export default proxy['default'];`;
    } else {
      return `export const ${name} = proxy['${name}'];`;
    }
  });

  let newCode = dedent`
    import { createClientModuleProxy } from "${rscClientPath}";
    let proxy = createClientModuleProxy("${moduleId}");

    ${exports.join("\n")}
  `;

  return {
    code: newCode,
    clientExports,
  };
}
