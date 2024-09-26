import "../monkey-patch.js";
import { MessagePort, parentPort, workerData } from "node:worker_threads";
import { ReadableStream } from "stream/web";
import { injectResolver } from "../monkey-patch.js";
import { serializeError } from "serialize-error";
import { pageSSR } from "./page-ssr.js";

if (!parentPort) {
  throw new Error("Must be run as a worker");
}

export type RenderRequest = {
  port: MessagePort;
  rscStream: ReadableStream<Uint8Array>;
  writeStream: WritableStream<Uint8Array>;
} & (
  | {
      method: "page";
      data: {
        path: string;
      };
    }
  | {
      method: "stream";
      data: undefined;
    }
);

let clientComponentModuleMap = workerData.clientComponentModuleMap;

injectResolver((moduleId) => {
  return clientComponentModuleMap[moduleId]?.path;
});

parentPort.on("message", async (request: RenderRequest) => {
  try {
    let htmlStream;

    // backend/ssr/page + backend/ssr/stream
    if (request.method === "page") {
      htmlStream = await pageSSR(request);
    } else if (request.method === "stream") {
      // htmlStream = await streamSSR(request);
    } else {
      throw new Error("Invalid ssr render request");
    }

    request.port.postMessage({ status: "OK" });
    await htmlStream.pipeTo(request.writeStream);
  } catch (e: unknown) {
    let error = e instanceof Error ? e : new Error("Unknown error");
    let serializedError = serializeError(error);
    request.port.postMessage({ status: "ERROR", serializedError });
  } finally {
    request.port.close();
  }
});
