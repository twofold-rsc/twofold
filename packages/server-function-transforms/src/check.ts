import { transformAsync } from "@babel/core";
import { transform as esbuildTransform } from "esbuild";
import { CheckPlugin } from "./plugins/check-plugin.js";

type CheckOptions = {
  input: {
    code: string;
    language: "js" | "jsx" | "ts" | "tsx";
  };
  moduleId: string;
};

export async function check({ input }: CheckOptions) {
  let esResult = await esbuildTransform(input.code, {
    loader: input.language,
    jsx: "automatic",
    format: "esm",
  });

  let result = await transformAsync(esResult.code, {
    plugins: [[CheckPlugin]],
    ast: true,
    code: false,
  });

  let isServerModule =
    result?.metadata &&
    "isServerModule" in result.metadata &&
    typeof result.metadata.isServerModule === "boolean"
      ? result.metadata.isServerModule
      : false;

  return isServerModule;
}
