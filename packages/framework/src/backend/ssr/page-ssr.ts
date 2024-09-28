// this file has a bit of indirection and the ssr-app is the
// real code that handles ssr-ing a page. the reason for these
// files is i wanted to organize a bunch of ssr logic somewhere.

import { parentPort, workerData } from "node:worker_threads";
import { pathToFileURL } from "node:url";
import { RenderRequest } from "./worker.js";

if (!parentPort) {
  throw new Error("Must be run as a worker");
}

let appPath = workerData.appPath;
let bootstrapUrl = workerData.bootstrapUrl;
let ssrManifestModuleMap = workerData.ssrManifestModuleMap;

let appModule = await import(pathToFileURL(appPath).href);
let render = appModule.render;

type PageRenderRequest = Extract<RenderRequest, { method: "page" }>;

export async function pageSSR(request: PageRenderRequest) {
  return await render({
    rscStream: request.rscStream,
    ssrManifestModuleMap,
    path: request.data.path,
    bootstrapUrl,
  });
}
