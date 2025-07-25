import { ClientAppBuilder } from "../builders/client-app-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { StaticFilesBuilder } from "../builders/static-files-builder.js";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { time } from "../helpers/time.js";
import { ServerFilesBuilder } from "../builders/server-files-builder.js";
import { Build } from "./build.js";
import { AssetsBuilder } from "../builders/assets-builder.js";

export class ProductionBuild extends Build {
  readonly name = "production";
  readonly canReload = false;

  constructor() {
    super();

    let entriesBuilder = new EntriesBuilder({
      build: this,
    });
    let rscBuilder = new RSCBuilder({
      build: this,
      entriesBuilder,
    });
    let clientAppBuilder = new ClientAppBuilder({
      build: this,
      entriesBuilder,
    });
    let serverFilesBuilder = new ServerFilesBuilder({
      build: this,
    });
    let staticFilesBuilder = new StaticFilesBuilder();
    let assetsBuilder = new AssetsBuilder({
      build: this,
    });

    this.addBuilder(entriesBuilder);
    this.addBuilder(rscBuilder);
    this.addBuilder(clientAppBuilder);
    this.addBuilder(serverFilesBuilder);
    this.addBuilder(staticFilesBuilder);
    this.addBuilder(assetsBuilder);
  }

  async build() {
    return this.createNewBuild(async () => {
      let entriesBuild = this.getBuilder("entries").build();
      let staticFilesBuild = this.getBuilder("static-files").build();
      let serverFilesBuild = this.getBuilder("server-files").build();

      let frameworkTime = time("framework build");
      frameworkTime.start();
      await Promise.all([entriesBuild, serverFilesBuild, staticFilesBuild]);
      frameworkTime.end();
      // frameworkTime.log();

      let firstPassError =
        this.getBuilder("entries").error ||
        this.getBuilder("server-files").error ||
        this.getBuilder("static-files").error;

      if (!firstPassError) {
        let rscBuild = this.getBuilder("rsc").build();
        let clientBuild = this.getBuilder("client").build();

        let appTime = time("app build");
        appTime.start();
        await Promise.all([clientBuild, rscBuild]);
        appTime.end();
        // appTime.log();
      }

      let secondPhaseError =
        this.getBuilder("rsc").error || this.getBuilder("client").error;

      if (!secondPhaseError) {
        let assetsBuild = this.getBuilder("assets").build();
        let appTime = time("assets build");
        appTime.start();
        await assetsBuild;
        appTime.end();
        // appTime.log();
      }
    });
  }
}
