import "../monkey-patch.js";
import {
  MessagePort,
  parentPort,
  TransferListItem,
  workerData,
} from "node:worker_threads";
import { ReadableStream } from "stream/web";
import { injectResolver } from "../monkey-patch.js";
import { serializeError } from "serialize-error";
import { pageSSR } from "./page-ssr.js";
import { combineBatch, createBatchStream } from "../steams/batch-stream.js";
import { ReactDOMServerReadableStream } from "react-dom/server";
import { invariant } from "../utils/invariant.js";

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
  let htmlStream: ReactDOMServerReadableStream | undefined;
  let htmlAbortController = new AbortController();

  let isRequestActive = true;
  let isRscStreamActive = true;

  let rscController: ReadableStreamDefaultController<Uint8Array> | undefined;
  let rscStream = new ReadableStream<Uint8Array>({
    start(controller) {
      rscController = controller;
    },
  });

  function closeInput() {
    if (isRscStreamActive && rscController) {
      isRscStreamActive = false;

      try {
        rscController.close();
      } catch {
        // ignore
      }
    }
  }

  function finish() {
    if (!isRequestActive) return;
    isRequestActive = false;

    request.port.off("message", handler);

    closeInput();

    try {
      request.port.close();
    } catch {
      // ignore
    }
  }

  function cancel() {
    if (!htmlAbortController.signal.aborted) {
      htmlAbortController.abort();
    }

    finish();
  }

  function post(message: unknown, transfer?: TransferListItem[]) {
    if (!isRequestActive) return false;

    try {
      request.port.postMessage(message, transfer);
      return true;
    } catch {
      return false;
    }
  }

  let didFail = false;
  function fail(error: unknown) {
    if (!didFail) {
      didFail = true;

      let normalized =
        error instanceof Error ? error : new Error("Unknown error");

      post({
        status: "ERROR",
        serializedError: serializeError(normalized),
      });

      cancel();
    }
  }

  function handler(data: unknown) {
    if (!isRequestActive) return;

    if (data && typeof data === "object" && "status" in data) {
      if (data.status === "DONE") {
        closeInput();
      } else if (data.status === "CANCEL") {
        cancel();
      } else {
        fail(new Error("Invalid message from main"));
      }
    } else if (data instanceof Uint8Array) {
      if (isRscStreamActive && rscController) {
        try {
          rscController.enqueue(data);
        } catch (error) {
          fail(error);
        }
      }
    } else {
      fail(new Error("Invalid message from main"));
    }
  }

  request.port.on("message", handler);

  try {
    if (request.mode === "page") {
      htmlStream = await pageSSR({
        ...request,
        rscStream,
        signal: htmlAbortController.signal,
      });
    } else {
      throw new Error("Invalid mode");
    }

    if (!isRequestActive) {
      return;
    }

    let didOk = post({ status: "OK" });
    if (!didOk) {
      cancel();
      return;
    }

    invariant(htmlStream);

    for await (let batch of htmlStream.pipeThrough(createBatchStream())) {
      if (!isRequestActive) break;

      let chunk = combineBatch(batch);
      let didSend = post(chunk, [chunk.buffer]);
      if (!didSend) {
        // something bad happened...
        cancel();
        break;
      }
    }

    if (isRequestActive) {
      post({ status: "DONE" });
      finish();
    }
  } catch (error) {
    fail(error);
  }
});
