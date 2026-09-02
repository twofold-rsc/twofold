import { RouteHandler } from "@hattip/router";
import { Runtime } from "../../runtime.js";

export function waitForSSR(runtime: Runtime): RouteHandler {
  let ssrWorkerIsReady = () => runtime.hasSSRWorker;

  return async () => {
    if (!ssrWorkerIsReady()) {
      await new Promise<void>((resolve) => {
        let timerId = setInterval(() => {
          if (ssrWorkerIsReady()) {
            clearInterval(timerId);
            resolve();
          }
        }, 120);
      });
    }
  };
}
