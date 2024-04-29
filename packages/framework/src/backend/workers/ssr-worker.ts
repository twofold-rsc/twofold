import "../monkey-patch.js";
import { MessagePort, parentPort, workerData } from "node:worker_threads";
import { ReadableStream } from "stream/web";
import { injectResolver } from "../monkey-patch.js";
import { pathToFileURL } from "node:url";
import { serializeError } from "serialize-error";
// import { getSSRStore, runSSRStore } from "../stores/ssr-store.js";

if (!parentPort) {
  throw new Error("Must be run as a worker");
}

type RenderRequest = {
  port: MessagePort;
  pathname: string;
  rscStream: ReadableStream<Uint8Array>;
  writeStream: WritableStream<Uint8Array>;
};

let appPath = workerData.appPath;
let bootstrapUrl = workerData.bootstrapUrl;
let clientComponentModuleMap = workerData.clientComponentModuleMap;

injectResolver((moduleId) => {
  return clientComponentModuleMap[moduleId]?.path;
});

let appModule = await import(pathToFileURL(appPath).href);
let render = appModule.render;

parentPort.on(
  "message",
  async ({ port, pathname, rscStream, writeStream }: RenderRequest) => {
    try {
      let htmlStream = await render({
        rscStream,
        path: pathname,
        bootstrapUrl,
      });

      port.postMessage({ status: "OK" });
      await htmlStream.pipeTo(writeStream);
    } catch (e: unknown) {
      let error = e instanceof Error ? e : new Error("Unknown error");
      let serializedError = serializeError(error);
      port.postMessage({ status: "ERROR", serializedError });
    } finally {
      port.close();
    }
  },
);
