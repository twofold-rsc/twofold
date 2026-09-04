import { RouteHandler } from "@hattip/router";

export function waitForSSR(): RouteHandler {
  // i think theres a chance a request could be stuck in this middleware.
  // the request comes in, the runtime exists, but by the time the request
  // gets here the runtime is shut down and the ssr worker is disposed.
  //
  // how do we handle that? need to throw an error i guess.
  //
  // this means we need ssr server tracking / state
  return async (ctx) => {
    let runtime = ctx.runtime;

    if (!runtime || runtime?.hasSSRWorker) {
      return;
    }

    let ssrWorkerIsReady = () => runtime.hasSSRWorker;

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
