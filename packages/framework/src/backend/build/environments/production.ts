import { ClientAppBuilder } from "../builders/client-app-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { StaticFilesBuilder } from "../builders/static-files-builder.js";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { time } from "../helpers/time.js";
import { ServerFilesBuilder } from "../builders/server-files-builder.js";
import { Environment } from "./environment.js";

export class ProductionEnvironment extends Environment {
  readonly name = "production";

  constructor() {
    super();

    let entriesBuilder = new EntriesBuilder({
      environment: this,
    });
    let rscBuilder = new RSCBuilder({
      environment: this,
      entriesBuilder,
    });
    let clientAppBuilder = new ClientAppBuilder({
      environment: this,
      entriesBuilder,
    });
    let serverFilesBuilder = new ServerFilesBuilder({
      environment: this,
    });
    let staticFilesBuilder = new StaticFilesBuilder();

    this.addBuilder(entriesBuilder);
    this.addBuilder(rscBuilder);
    this.addBuilder(clientAppBuilder);
    this.addBuilder(serverFilesBuilder);
    this.addBuilder(staticFilesBuilder);
  }

  async build() {
    let buildTime = time("build");
    buildTime.start();

    let entriesBuild = this.getBuilder("entries").build();
    let staticFilesBuild = this.getBuilder("static-files").build();
    let serverFilesBuild = this.getBuilder("server-files").build();

    let frameworkTime = time("framework build");
    frameworkTime.start();
    await Promise.all([entriesBuild, serverFilesBuild, staticFilesBuild]);
    frameworkTime.end();
    // frameworkTime.log();

    if (!this.error) {
      let rscBuild = this.getBuilder("rsc").build();
      let clientBuild = this.getBuilder("client").build();

      let appTime = time("app build");
      appTime.start();
      await Promise.all([clientBuild, rscBuild]);
      appTime.end();
      // appTime.log();
    }

    this.generateKey();

    buildTime.end();

    console.log(
      `🏗️  Built app in ${buildTime.duration.toFixed(2)}ms [version: ${
        this.key
      }]`
    );
  }
}
