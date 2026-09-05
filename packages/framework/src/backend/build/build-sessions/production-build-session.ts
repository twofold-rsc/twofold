import { AssetsBuilder } from "../builders/assets-builder.js";
import { ClientBuilder } from "../builders/client-builder.js";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { ServerFilesBuilder } from "../builders/server-files-builder.js";
import { StaticFilesBuilder } from "../builders/static-files-builder.js";
import { BuildSession } from "./build-session.js";

export class ProductionBuildSession extends BuildSession<"production"> {
  constructor() {
    super("production", {
      entries: new EntriesBuilder(),
      serverFiles: new ServerFilesBuilder(),
      staticFiles: new StaticFilesBuilder(),
      rsc: new RSCBuilder(),
      client: new ClientBuilder(),
      assets: new AssetsBuilder(),
    });
  }

  async build() {
    return await this.createNewBuild(async ({ attempt, previous, config }) => {
      let serverFilesResult = previous?.outputs.serverFiles
        ? attempt.keep("serverFiles")
        : await attempt.run("serverFiles", {
            environment: "production",
          });

      if (serverFilesResult.status === "error") {
        return;
      }

      let entriesResult = await attempt.run("entries", {
        sourceRoot: this.sourceRoot,
        config,
      });

      if (entriesResult.status === "error") {
        return;
      }

      let [staticFilesResult, rscResult, clientResult] = await Promise.all([
        attempt.run("staticFiles", {
          entries: entriesResult.output,
        }),
        attempt.run("rsc", {
          environment: "production",
          entries: entriesResult.output,
        }),
        attempt.run("client", {
          environment: "production",
          config,
          entries: entriesResult.output,
          serverFiles: serverFilesResult.output,
        }),
      ]);

      if (
        staticFilesResult.status === "error" ||
        rscResult.status === "error" ||
        clientResult.status === "error"
      ) {
        return;
      }

      let assetsResult = await attempt.run("assets", {
        environment: "production",
        rsc: rscResult.output,
        client: clientResult.output,
      });

      if (assetsResult.status === "error") {
        return;
      }

      return {
        entries: entriesResult.output,
        serverFiles: serverFilesResult.output,
        staticFiles: staticFilesResult.output,
        rsc: rscResult.output,
        client: clientResult.output,
        assets: assetsResult.output,
      };
    });
  }
}
