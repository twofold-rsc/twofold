import { ClientAppBuilder } from "../builders/client-app-builder.js";
import { RSCBuilder } from "../builders/rsc-builder.js";
import { DevErrorPageBuilder } from "../builders/dev-error-page-builder.js";
import { StaticFilesBuilder } from "../builders/static-files-builder.js";
import { EntriesBuilder } from "../builders/entries-builder.js";
import { ServerFilesBuilder } from "../builders/server-files-builder.js";
import { time } from "../helpers/time.js";
import { ClientComponentMapSnapshot } from "../snapshots/client-component-map-snapshot.js";
import { ClientChunksSnapshot } from "../snapshots/client-chunks-snapshot.js";
import { RSCSnapshot } from "../snapshots/rsc-snapshot.js";
import { CSSSnapshot } from "../snapshots/css-snapshot.js";
import { Build } from "./build.js";

export class DevelopmentBuild extends Build {
  readonly name = "development";
  readonly canReload = true;

  #clientComponentMapSnapshot = new ClientComponentMapSnapshot();
  #clientChunksSnapshot = new ClientChunksSnapshot();
  #rscSnapshot = new RSCSnapshot();
  #cssSnapshot = new CSSSnapshot();

  constructor() {
    super();

    let entriesBuilder = new EntriesBuilder({
      build: this,
    });
    let errorPageBuilder = new DevErrorPageBuilder();
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

    this.addBuilder(entriesBuilder);
    this.addBuilder(errorPageBuilder);
    this.addBuilder(rscBuilder);
    this.addBuilder(clientAppBuilder);
    this.addBuilder(serverFilesBuilder);
    this.addBuilder(staticFilesBuilder);
  }

  async build() {
    // stash old chunks so we can see what changed
    return await this.createNewBuild(async () => {
      if (!this.error) {
        this.#clientComponentMapSnapshot.take(
          this.getBuilder("client").clientComponentMap,
        );
        this.#clientChunksSnapshot.take(this.getBuilder("client").chunks);
        this.#rscSnapshot.take(this.getBuilder("rsc").files);
        this.#cssSnapshot.take(this.getBuilder("rsc").files);
      }

      let entriesBuild = this.getBuilder("entries").build();
      let errorPageBuild = this.getBuilder("dev-error-page").build();
      let serverFilesBuild = this.getBuilder("server-files").build();
      let staticFilesBuild = this.getBuilder("static-files").build();

      let frameworkTime = time("framework build");
      frameworkTime.start();
      await Promise.all([
        entriesBuild,
        errorPageBuild,
        serverFilesBuild,
        staticFilesBuild,
      ]);
      frameworkTime.end();
      // frameworkTime.log();

      let firstPassError =
        this.getBuilder("entries").error ||
        this.getBuilder("dev-error-page").error ||
        this.getBuilder("server-files").error ||
        this.getBuilder("static-files").error;

      // we don't want to continue here if any of the build steps
      // above happened to error
      if (!firstPassError) {
        let rscBuild = this.getBuilder("rsc").build();
        let clientBuild = this.getBuilder("client").build();

        let appTime = time("app build");
        appTime.start();
        await Promise.all([clientBuild, rscBuild]);
        appTime.end();
        // appTime.log();
      }
    });
  }

  get changes() {
    if (this.error) {
      return {};
    }

    this.#clientComponentMapSnapshot.latest(
      this.getBuilder("client").clientComponentMap,
    );

    this.#clientChunksSnapshot.latest(this.getBuilder("client").chunks);

    this.#rscSnapshot.latest(this.getBuilder("rsc").files);

    this.#cssSnapshot.latest(this.getBuilder("rsc").files);

    return {
      chunkIds: this.#clientComponentMapSnapshot.chunkIds,
      chunkFiles: this.#clientChunksSnapshot.chunkFiles,
      rscFiles: this.#rscSnapshot.rscFiles,
      cssFiles: this.#cssSnapshot.cssFiles,
    };
  }
}
