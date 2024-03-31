import { serializeError } from "serialize-error";
import { appCompiledDir } from "./files.js";
import { readFile } from "fs/promises";

export async function errorPage(error: Error) {
  let htmlFile = new URL("./server-files/error.html", appCompiledDir);
  let contents = await readFile(htmlFile, "utf-8");

  let errorString = JSON.stringify(serializeError(error));
  let message = error.message;

  let html = contents
    .replace("$error", errorString)
    .replace("$message", message);

  return html;
}
