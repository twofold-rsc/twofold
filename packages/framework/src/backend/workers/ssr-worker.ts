import "../monkey-patch.js";
// @ts-ignore
import { renderToReadableStream } from "react-dom/server.browser";
// @ts-ignore
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";
import { createElement } from "react";
import { MessagePort, parentPort, workerData } from "node:worker_threads";
import { ReadableStream } from "stream/web";
import { injectResolver } from "../monkey-patch.js";
import { shell } from "../error-shell.js";
// import { getSSRStore, runSSRStore } from "../stores/ssr-store.js";

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
  return clientComponentModuleMap[moduleId]?.server;
});

let appModule = await import(appPath);
let SSRApp = appModule.SSRApp;

parentPort.on("message", async ({ port, pathname }: RenderRequest) => {
  console.log("worker rendering", pathname);

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

  let [rscStream1, rscStream2] = rscStream.tee();
  let rscTree = createFromReadableStream(rscStream1);
  let rscStreamReader = rscStream2.getReader();

  // this lets the ssr store catch all chunks
  await new Promise((resolve) => setTimeout(resolve, 0));

  try {
    let htmlStream = await renderToReadableStream(
      createElement(SSRApp, {
        path: pathname,
        tree: rscTree,
        rscStreamReader,
      }),
      {
        bootstrapModules: [bootstrapUrl],
        onError(err: unknown) {
          // console.log("ssr worker onError");
          // do something useful here
          // console.log(err);
        },
      },
    );

    for await (const chunk of htmlStream) {
      port.postMessage(chunk, [chunk.buffer]);
    }
  } catch (e: unknown) {
    console.log(e);
    let error = e instanceof Error ? e : new Error("Unknown error");
    let html = shell(error);
    let buf = Buffer.from(html);
    port.postMessage(buf, [buf.buffer]);
  } finally {
    port.postMessage("DONE");
  }
});
