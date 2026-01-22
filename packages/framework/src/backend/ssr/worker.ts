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
  writeStream: WritableStream<Uint8Array>;
} & {
  mode: "page";
  rscStream: ReadableStream<Uint8Array>;
  data: {
    urlString: string;
  };
};

let clientComponentModuleMap = workerData.clientComponentModuleMap;

injectResolver((moduleId) => {
  return clientComponentModuleMap[moduleId]?.path;
});

parentPort.on("message", async (request: RenderRequest) => {
  // tee the stream, try to render it
  // if it fails send the other side into an error app
  try {
    let htmlStream;

    if (request.mode === "page") {
      htmlStream = await pageSSR(request);
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
