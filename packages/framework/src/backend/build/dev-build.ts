import { context } from "esbuild";
import { rm, stat, watch } from "node:fs/promises";
import { appCompiledDir, cwdUrl } from "../files.js";
import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import { ClientAppBuilder } from "./builders/client-app-builder.js";
import { RSCBuilder } from "./builders/rsc-builder.js";
import { DevErrorPageBuilder } from "./builders/dev-error-page-builder.js";
import { StaticFilesBuilder } from "./builders/static-files-builder.js";
import { EntriesBuilder } from "./builders/entries-builder.js";
import { ServerFilesBuilder } from "./builders/server-files-builder.js";
import { Build } from "./base-build.js";
import { time } from "./helpers/time.js";

class BuildEvents extends EventEmitter {}

export class DevBuild extends Build {
  readonly env = "development";

  #isBuilding = false;
  #events = new BuildEvents();
  #previousChunks = new Set<string>();
  #previousRSCFiles = new Set<string>();

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
      let clientComponentMapKeys = Object.keys(
        this.getBuilder("client").clientComponentMap,
      );
      this.#previousChunks = new Set<string>();
      for (let key of clientComponentMapKeys) {
        let chunks = this.getBuilder("client").clientComponentMap[key].chunks;
        for (let chunk of chunks) {
          this.#previousChunks.add(chunk);
        }
      }

      this.#previousRSCFiles = new Set(this.getBuilder("rsc").files);
    } else {
      this.#previousChunks = new Set();
      this.#previousRSCFiles = new Set();
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
      `🏗️  Built app in ${buildTime.duration.toFixed(2)}ms [version: ${this.key}]`,
    );

    this.#isBuilding = false;

    this.#events.emit("complete");
  }

  get events() {
    return this.#events;
  }

  // rename this
  get newChunks() {
    let clientComponentMapKeys = Object.keys(
      this.getBuilder("client").clientComponentMap,
    );
    let newChunks = new Set<string>();
    for (let key of clientComponentMapKeys) {
      let chunks = this.getBuilder("client").clientComponentMap[key].chunks;
      for (let chunk of chunks) {
        if (!this.#previousChunks.has(chunk)) {
          newChunks.add(chunk);
        }
      }
    }
    return newChunks;
  }

  private newRSCFiles(extension: string) {
    let newRSCs = new Set<string>();
    let RSCs = this.getBuilder("rsc").files.filter((file) =>
      file.endsWith(`.${extension}`),
    );
    for (let key of RSCs) {
      if (!this.#previousRSCFiles.has(key)) {
        newRSCs.add(key);
      }
    }

    return newRSCs;
  }

  get newRSCs() {
    return this.newRSCFiles("js");
  }

  get newCSSFiles() {
    return this.newRSCFiles("css");
  }

  async watch() {
    let dirs = ["./src", "./public"];
    dirs.forEach(async (dir) => {
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
          await this.build();
        }
      }
    });
  }
}
