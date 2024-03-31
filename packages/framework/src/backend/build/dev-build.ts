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

class BuildEvents extends EventEmitter {}

// Instead of Build class building everything there's really
// different types of things we need to build:
// Build objects (apps, error-app, static files)

export class DevBuild {
  readonly env = "development";

  #key = randomBytes(6).toString("hex");
  #isBuilding = false;
  #entriesBuilder: EntriesBuilder;
  #errorPageBuilder: DevErrorPageBuilder;
  #rscBuilder: RSCBuilder;
  #clientAppBuilder: ClientAppBuilder;
  #serverFilesBuilder: ServerFilesBuilder;
  #staticFilesBuilder: StaticFilesBuilder;
  #events = new BuildEvents();
  #previousChunks = new Set<string>();
  #previousRSCFiles = new Set<string>();

  constructor() {
    this.#entriesBuilder = new EntriesBuilder();
    this.#errorPageBuilder = new DevErrorPageBuilder();
    this.#rscBuilder = new RSCBuilder({
      entriesBuilder: this.#entriesBuilder,
    });
    this.#clientAppBuilder = new ClientAppBuilder({
      env: "development",
      entriesBuilder: this.#entriesBuilder,
    });
    this.#serverFilesBuilder = new ServerFilesBuilder({ env: "development" });
    this.#staticFilesBuilder = new StaticFilesBuilder();
  }

  get isBuilding() {
    return this.#isBuilding;
  }

  get key() {
    return this.#key;
  }

  async setup() {
    await rm(appCompiledDir, { recursive: true, force: true });
    await this.#entriesBuilder.setup();
    await this.#serverFilesBuilder.setup();
    await this.#errorPageBuilder.setup();
  }

  get error() {
    return (
      this.#entriesBuilder.error ||
      this.#rscBuilder.error ||
      this.#clientAppBuilder.error
    );
  }

  get builders() {
    return {
      entries: this.#entriesBuilder,
      client: this.#clientAppBuilder,
      rsc: this.#rscBuilder,
      error: this.#errorPageBuilder,
      static: this.#staticFilesBuilder,
    };
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
        this.builders.client.clientComponentMap,
      );
      this.#previousChunks = new Set<string>();
      for (let key of clientComponentMapKeys) {
        let chunks = this.builders.client.clientComponentMap[key].chunks;
        for (let chunk of chunks) {
          this.#previousChunks.add(chunk);
        }
      }

      this.#previousRSCFiles = new Set(this.#rscBuilder.files);
    } else {
      this.#previousChunks = new Set();
      this.#previousRSCFiles = new Set();
    }

    let entriesBuild = this.#entriesBuilder.build();
    let errorPageBuild = this.#errorPageBuilder.build();
    let serverFilesBuild = this.#serverFilesBuilder.build();
    let staticFilesBuild = this.#staticFilesBuilder.build();

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

    if (!this.#entriesBuilder.error) {
      let rscBuild = this.#rscBuilder.build();
      let clientBuild = this.#clientAppBuilder.build();

      let appTime = time("app build");
      appTime.start();
      await Promise.all([clientBuild, rscBuild]);
      appTime.end();
      // appTime.log();
    }

    this.#key = randomBytes(6).toString("hex");

    buildTime.end();

    console.log(
      `🏗️  Built app in ${buildTime.duration.toFixed(2)}ms [version: ${this.#key}]`,
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
      this.builders.client.clientComponentMap,
    );
    let newChunks = new Set<string>();
    for (let key of clientComponentMapKeys) {
      let chunks = this.builders.client.clientComponentMap[key].chunks;
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
    let RSCs = this.#rscBuilder.files.filter((file) =>
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

export type BuildContext = Awaited<ReturnType<typeof context>>;
export type BuildMetafile = Awaited<
  ReturnType<BuildContext["rebuild"]>
>["metafile"];

function time(name: string) {
  let key = randomBytes(16).toString("hex");
  return {
    start() {
      performance.mark(`${key} start`);
    },
    end() {
      performance.mark(`${key} end`);
    },
    get duration() {
      let measure = performance.measure(
        `${key} duration`,
        `${key} start`,
        `${key} end`,
      );
      return measure.duration;
    },
    log() {
      console.log(`${name} duration ${this.duration.toFixed(2)}ms`);
    },
  };
}
