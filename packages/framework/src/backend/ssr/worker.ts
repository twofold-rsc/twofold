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
} & {
  mode: "page";
  data: {
    urlString: string;
  };
};

let clientComponentModuleMap = workerData.clientComponentModuleMap;

injectResolver((moduleId) => {
  return clientComponentModuleMap[moduleId]?.path;
});

parentPort.on("message", async (request: RenderRequest) => {
  try {
    let htmlStream;

    let rscController: ReadableStreamDefaultController<Uint8Array>;
    let rscStream = new ReadableStream<Uint8Array>({
      start(streamController) {
        rscController = streamController;
      },
    });

    function handler(data: unknown) {
      if (data instanceof Uint8Array) {
        rscController.enqueue(data);
      } else if (data && typeof data === "object" && "status" in data) {
        if (data.status === "DONE") {
          rscController.close();
          request.port.off("message", handler);
        }
      }
    }

    request.port.on("message", handler);

    if (request.mode === "page") {
      htmlStream = await pageSSR({
        ...request,
        rscStream,
      });
    } else {
      throw new Error("Invalid mode");
    }

    request.port.postMessage({ status: "OK" });

    for await (let chunk of htmlStream) {
      request.port.postMessage(chunk, [chunk.buffer]);
    }

    request.port.postMessage({ status: "DONE" });
  } catch (e: unknown) {
    let error = e instanceof Error ? e : new Error("Unknown error");
    let serializedError = serializeError(error);
    request.port.postMessage({ status: "ERROR", serializedError });
  } finally {
    request.port.close();
  }
});
