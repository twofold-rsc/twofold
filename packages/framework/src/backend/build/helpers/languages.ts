import path from "path";
import * as z from "zod";

let languageSchema = z.union([
  z.literal("ts"),
  z.literal("tsx"),
  z.literal("js"),
  z.literal("jsx"),
]);

let fileExtensionSchema = z.union([
  z.literal("ts"),
  z.literal("tsx"),
  z.literal("js"),
  z.literal("jsx"),
  z.literal("mjs"),
]);

const fileExtensionToLanguageMap = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
};

export function pathToLanguage(filePath: string) {
  let extension = path.extname(filePath).slice(1);
  let scopedExtension = fileExtensionSchema.parse(extension);
  let language = languageSchema.parse(
    fileExtensionToLanguageMap[scopedExtension],
  );

  return language;
}
