import {
  AssetsBuilder,
  type AssetsOutput,
} from "../builders/assets-builder.js";
import {
  ClientBuilder,
  type ClientOutput,
} from "../builders/client-builder.js";
import {
  DevErrorPageBuilder,
  type DevErrorPageOutput,
} from "../builders/dev-error-page-builder.js";
import {
  EntriesBuilder,
  type EntriesOutput,
} from "../builders/entries-builder.js";
import { RSCBuilder, type RSCOutput } from "../builders/rsc-builder.js";
import {
  ServerFilesBuilder,
  type ServerFilesOutput,
} from "../builders/server-files-builder.js";
import {
  StaticFilesBuilder,
  type StaticFilesOutput,
} from "../builders/static-files-builder.js";
import { BuildSession } from "./build-session.js";

type DevelopmentOutputs = {
  readonly entries: EntriesOutput;
  readonly devErrorPage: DevErrorPageOutput;
  readonly serverFiles: ServerFilesOutput;
  readonly staticFiles: StaticFilesOutput;
  readonly rsc: RSCOutput;
  readonly client: ClientOutput;
  readonly assets: AssetsOutput;
};

export class DevelopmentBuildSession extends BuildSession<DevelopmentOutputs> {
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
    return await this.createNewBuild(async ({ attempt, previous }) => {
      let [errorPageResult, serverFilesResult, configResult] =
        await Promise.all([
          previous?.outputs.devErrorPage
            ? attempt.keep("devErrorPage")
            : attempt.run("devErrorPage"),
          previous?.outputs.serverFiles
            ? attempt.keep("serverFiles")
            : attempt.run("serverFiles", {
                environment: "development",
              }),
          attempt.capture(() => this.getAppConfig()),
        ]);

      if (
        errorPageResult.status === "error" ||
        serverFilesResult.status === "error" ||
        configResult.status === "error"
      ) {
        return;
      }

      let entriesResult = await attempt.run("entries", {
        sourceRoot: this.sourceRoot,
        config: configResult.output,
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
          config: configResult.output,
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
