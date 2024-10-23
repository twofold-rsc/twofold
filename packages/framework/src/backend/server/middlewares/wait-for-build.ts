import { RouteHandler } from "@hattip/router";
import { DevelopmentEnvironment } from "../../build/environments/development";

export function waitForBuild(build: DevelopmentEnvironment): RouteHandler {
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
