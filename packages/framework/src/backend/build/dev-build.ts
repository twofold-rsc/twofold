import { stat, watch } from "node:fs/promises";
import { cwdUrl } from "../files.js";
import { EventEmitter } from "node:events";
import { ClientAppBuilder } from "./builders/client-app-builder.js";
import { RSCBuilder } from "./builders/rsc-builder.js";
import { DevErrorPageBuilder } from "./builders/dev-error-page-builder.js";
import { StaticFilesBuilder } from "./builders/static-files-builder.js";
import { EntriesBuilder } from "./builders/entries-builder.js";
import { ServerFilesBuilder } from "./builders/server-files-builder.js";
import { Build } from "./base-build.js";
import { time } from "./helpers/time.js";
import { ClientComponentMapSnapshot } from "./snapshots/client-component-map-snapshot.js";
import { ClientChunksSnapshot } from "./snapshots/client-chunks-snapshot.js";
import { RSCSnapshot } from "./snapshots/rsc-snapshot.js";
import { CSSSnapshot } from "./snapshots/css-snapshot.js";

class BuildEvents extends EventEmitter {}

export class DevBuild extends Build {
  readonly env = "development";

  #isBuilding = false;
  #events = new BuildEvents();

  #clientComponentMapSnapshot = new ClientComponentMapSnapshot();
  #clientChunksSnapshot = new ClientChunksSnapshot();
  #rscSnapshot = new RSCSnapshot();
  #cssSnapshot = new CSSSnapshot();

  constructor() {
    super();

    let entriesBuilder = new EntriesBuilder();
    let errorPageBuilder = new DevErrorPageBuilder();
    let rscBuilder = new RSCBuilder({
      entriesBuilder,
    });
    let clientAppBuilder = new ClientAppBuilder({
      env: "development",
      entriesBuilder,
    });
    let serverFilesBuilder = new ServerFilesBuilder({ env: "development" });
    let staticFilesBuilder = new StaticFilesBuilder();

    this.addBuilder(entriesBuilder);
    this.addBuilder(errorPageBuilder);
    this.addBuilder(rscBuilder);
    this.addBuilder(clientAppBuilder);
    this.addBuilder(serverFilesBuilder);
    this.addBuilder(staticFilesBuilder);
  }

  get isBuilding() {
    return this.#isBuilding;
  }

  async build() {
    let buildTime = time("build");
    buildTime.start();

    if (this.#isBuilding) {
      // i need to figure this out
      return;
    }

    this.#isBuilding = true;

    // stash old chunks so we can see what changed
    if (!this.error) {
      this.#clientComponentMapSnapshot.take(
        this.getBuilder("client").clientComponentMap
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

    this.#isBuilding = false;

    this.#events.emit("complete");
  }

  get events() {
    return this.#events;
  }

  get changes() {
    if (this.error) {
      return {};
    }

    this.#clientComponentMapSnapshot.latest(
      this.getBuilder("client").clientComponentMap
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

  async watch() {
    let buildDirs = ["./src", "./public"];
    let setupDirs = ["./config"];

    [...buildDirs, ...setupDirs].forEach(async (dir) => {
      let url = new URL(dir, cwdUrl);
      let canWatch = false;
      try {
        let stats = await stat(url);
        canWatch = stats.isDirectory();
      } catch (_e) {
        canWatch = false;
      }

      if (canWatch) {
        let watched = watch(dir, { recursive: true });
        for await (let _event of watched) {
          if (buildDirs.includes(dir)) {
            await this.build();
          } else if (setupDirs.includes(dir)) {
            await this.stop();
            await this.setup();
            await this.build();
          }
        }
      }
    });
  }
}
