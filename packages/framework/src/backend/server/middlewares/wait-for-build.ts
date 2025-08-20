import { RouteHandler } from "@hattip/router";
import { Runtime } from "../../runtime.js";

// should take a build
// should use a bus
export function waitForBuild(runtime: Runtime): RouteHandler {
  let build = runtime.build;

  let buildIsReady = () => !build.isBuilding && build.hasBuilt;

  return async () => {
    if (build.lock) {
      await build.lock;
    }

    if (!buildIsReady()) {
      await new Promise<void>((resolve) => {
        let timerId = setInterval(() => {
          if (buildIsReady()) {
            clearInterval(timerId);
            resolve();
          }
        }, 120);
      });
    }
  };
}
