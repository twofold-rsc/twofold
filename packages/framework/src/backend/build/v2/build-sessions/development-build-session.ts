import { AssetsBuilder } from "../builders/assets-builder.js";
import { ClientBuilder } from "../builders/client-builder.js";
import { DevErrorPageBuilder } from "../builders/dev-error-page-builder.js";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { ServerFilesBuilder } from "../builders/server-files-builder.js";
import { StaticFilesBuilder } from "../builders/static-files-builder.js";
import { BuildSession } from "./build-session.js";

export class DevelopmentBuildSession extends BuildSession<"development"> {
  constructor() {
    super("development", {
      entries: new EntriesBuilder(),
      devErrorPage: new DevErrorPageBuilder(),
      serverFiles: new ServerFilesBuilder(),
      staticFiles: new StaticFilesBuilder(),
      rsc: new RSCBuilder(),
      client: new ClientBuilder(),
      assets: new AssetsBuilder(),
    });
  }

  async build() {
    return await this.createNewBuild(async ({ attempt, previous, config }) => {
      let [errorPageResult, serverFilesResult] = await Promise.all([
        previous?.outputs.devErrorPage
          ? attempt.keep("devErrorPage")
          : attempt.run("devErrorPage"),
        previous?.outputs.serverFiles
          ? attempt.keep("serverFiles")
          : attempt.run("serverFiles", {
              environment: "development",
            }),
      ]);

      if (
        errorPageResult.status === "error" ||
        serverFilesResult.status === "error"
      ) {
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
          environment: "development",
          entries: entriesResult.output,
        }),
        attempt.run("client", {
          environment: "development",
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
        environment: "development",
        rsc: rscResult.output,
        client: clientResult.output,
      });

      if (assetsResult.status === "error") {
        return;
      }

      return {
        entries: entriesResult.output,
        devErrorPage: errorPageResult.output,
        serverFiles: serverFilesResult.output,
        staticFiles: staticFilesResult.output,
        rsc: rscResult.output,
        client: clientResult.output,
        assets: assetsResult.output,
      };
    });
  }
}
