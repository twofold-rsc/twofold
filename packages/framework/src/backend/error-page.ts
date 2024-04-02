import { serializeError } from "serialize-error";
import { appCompiledDir } from "./files.js";
import { readFile } from "fs/promises";

export async function errorPage(error: Error) {
  let htmlFile = new URL("./server-files/error.html", appCompiledDir);
  let contents = await readFile(htmlFile, "utf-8");

  let errorString = JSON.stringify(serializeError(error));
  let message = error.message;
  let digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  let html = contents
    .replace("$error", errorString)
    .replace("$message", message)
    .replace("$digest", digest);

  // we should maybe include on on pop state + window.reload
  // logic alongside this html

  return html;
}
