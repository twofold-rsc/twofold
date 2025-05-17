import { transform as esbuildTransform } from "esbuild";
import { transformAsync } from "@babel/core";
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
    ast: false,
    code: false,
  });

  let answer =
    result?.metadata &&
    "isClientModule" in result.metadata &&
    typeof result.metadata.isClientModule === "boolean"
      ? result.metadata.isClientModule
      : false;

  return answer;
}
