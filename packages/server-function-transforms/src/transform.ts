import { transformAsync } from "@babel/core";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { transform as esbuildTransform } from "esbuild";
import { ServerTransformPlugin } from "./plugins/server-transform-plugin.js";
import { ClientTransformPlugin } from "./plugins/client-transform-plugin.js";

type BaseTransformOptions = {
  input: {
    code: string;
    language: "js" | "jsx" | "ts" | "tsx";
  };
  moduleId: string;
};

type ServerTransformOptions = BaseTransformOptions & {
  encryption?: {
    key: t.Expression;
    module?: string;
  };
  client?: never;
};

type ClientTransformOptions = BaseTransformOptions & {
  client: {
    callServerModule: string;
  };
  encryption?: never;
};

type TransformOptions = ServerTransformOptions | ClientTransformOptions;

export async function transform({
  input,
  encryption,
  client,
  moduleId,
}: TransformOptions) {
  let esResult = await esbuildTransform(input.code, {
    loader: input.language,
    jsx: "automatic",
    format: "esm",
  });

  let output = client ? "client" : "server";

  let plugins =
    output === "server"
      ? [
          [
            ServerTransformPlugin,
            {
              moduleId,
              encryption: {
                key: encryption?.key,
                module: encryption?.module,
              },
            },
          ],
        ]
      : [
          [
            ClientTransformPlugin,
            {
              moduleId,
              callServerModule: client?.callServerModule,
            },
          ],
        ];

  let codeAst = await transformAsync(esResult.code, {
    plugins,
    ast: true,
    code: false,
  });

  let serverFunctions: string[] =
    codeAst?.metadata &&
    "serverFunctions" in codeAst.metadata &&
    codeAst.metadata.serverFunctions instanceof Set
      ? Array.from(codeAst.metadata.serverFunctions)
      : [];

  if (serverFunctions.length === 0) {
    return {
      code: esResult.code,
      serverFunctions,
    };
  }

  let ast = codeAst?.ast;
  if (!ast) {
    throw new Error(
      "Failed to transform code. This is probably a bug in @twofold/server-function-transforms.",
    );
  }

  // babel types are currently being reworked and this is broken
  // @ts-expect-error
  let result = generate.default(ast, { compact: false });

  return {
    code: result.code,
    serverFunctions,
  };
}
