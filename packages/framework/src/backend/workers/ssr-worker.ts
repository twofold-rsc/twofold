import "../monkey-patch.js";
import { MessagePort, parentPort, workerData } from "node:worker_threads";
import { ReadableStream } from "stream/web";
import { injectResolver } from "../monkey-patch.js";
import { errorPage } from "../error-page.js";
// import { getSSRStore, runSSRStore } from "../stores/ssr-store.js";

console.log('loading worker...')

if (!parentPort) {
  throw new Error("Must be run as a worker");
}

type RenderRequest = {
  port: MessagePort;
  pathname: string;
};

let appPath = workerData.appPath;
let bootstrapUrl = workerData.bootstrapUrl;
let clientComponentModuleMap = workerData.clientComponentModuleMap;

injectResolver((moduleId) => {
  return clientComponentModuleMap[moduleId]?.path;
});

console.log({ appPath });

console.log('here...')
await new Promise(resolve => setTimeout(resolve, 1000))

let appModule = await import(appPath);
let render = appModule.render;

parentPort.on("message", async ({ port, pathname }: RenderRequest) => {
  let rscStream = new ReadableStream({
    start(controller) {
      let handle = function (chunk: Uint8Array | string) {
        if (typeof chunk === "string" && chunk === "DONE") {
          port.off("message", handle);
          controller.close();
        } else {
          controller.enqueue(chunk);
        }
      };

      port.on("message", handle);
    },
  });

  try {
    let htmlStream = await render({
      rscStream,
      path: pathname,
      bootstrapUrl,
    });

    for await (const chunk of htmlStream) {
      port.postMessage(chunk, [chunk.buffer]);
    }
  } catch (e: unknown) {
    let error = e instanceof Error ? e : new Error("Unknown error");
    let html = await errorPage(error);
    let buf = Buffer.from(html);
    port.postMessage(buf, [buf.buffer]);
  } finally {
    port.postMessage("DONE");
  }
});
