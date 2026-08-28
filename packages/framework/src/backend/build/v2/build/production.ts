import { AssetsBuilder, type AssetsOutput } from "../builders/assets-builder.js";
import { ClientBuilder, type ClientOutput } from "../builders/client-builder.js";
import { EntriesBuilder, type EntriesOutput } from "../builders/entries-builder.js";
import { RSCBuilder, type RSCOutput } from "../builders/rsc-builder.js";
import {
  ServerFilesBuilder,
  type ServerFilesOutput,
} from "../builders/server-files-builder.js";
import {
  StaticFilesBuilder,
  type StaticFilesOutput,
} from "../builders/static-files-builder.js";
import { Build } from "./build.js";

export type ProductionOutputs = {
  readonly entries: EntriesOutput;
  readonly serverFiles: ServerFilesOutput;
  readonly staticFiles: StaticFilesOutput;
  readonly rsc: RSCOutput;
  readonly client: ClientOutput;
  readonly assets: AssetsOutput;
};

export class ProductionBuild extends Build<ProductionOutputs> {
  readonly #builders = {
    entries: new EntriesBuilder(),
    serverFiles: new ServerFilesBuilder(),
    staticFiles: new StaticFilesBuilder(),
    rsc: new RSCBuilder(),
    client: new ClientBuilder(),
    assets: new AssetsBuilder(),
  };

  async build() {
    return await this.createNewBuild(
      this.#builders,
      async ({ attempt, previous }) => {
        let [serverFilesResult, configResult] = await Promise.all([
          previous?.outputs.serverFiles
            ? attempt.keep("serverFiles")
            : attempt.run("serverFiles", {
                environment: "production",
              }),
          attempt.capture(() => this.getAppConfig()),
        ]);

        if (
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
            environment: "production",
            entries: entriesResult.output,
          }),
          attempt.run("client", {
            environment: "production",
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
      },
    );
  }
}
