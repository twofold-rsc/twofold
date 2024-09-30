import { RouteHandler } from "@hattip/router";
import { DevBuild } from "../../build/dev-build";

export function waitForBuild(build: DevBuild): RouteHandler {
  return async () => {
    if (build.isBuilding) {
      await new Promise<void>((resolve) => {
        build.events.once("complete", () => {
          resolve();
        });
      });
    }
  };
}
