import { context } from "esbuild";
import { stat, watch } from "node:fs/promises";
import { cwdUrl } from "./files.js";
import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import { ClientAppBuilder } from "./build/client-app-builder.js";
import { RSCBuilder } from "./build/rsc-builder.js";
import { ErrorPageBuilder } from "./build/error-page-builder.js";
import { StaticFilesBuilder } from "./build/static-files-builder.js";
import { EntriesBuilder } from "./build/entries-builder.js";

class BuildEvents extends EventEmitter {}

// Instead of Build class building everything there's really
// different types of things we need to build:
// Build objects (apps, error-app, static files)

export class Build {
  #key = randomBytes(6).toString("hex");
  #isBuilding = false;
  #entriesBuilder: EntriesBuilder;
  #errorPageBuilder: ErrorPageBuilder;
  #rscBuilder: RSCBuilder;
  #clientAppBuilder: ClientAppBuilder;
  #staticFilesBuilder: StaticFilesBuilder;
  #events = new BuildEvents();
  #previousChunks = new Set<string>();
  #previousRSCFiles = new Set<string>();

  constructor() {
    this.#entriesBuilder = new EntriesBuilder();
    this.#errorPageBuilder = new ErrorPageBuilder();
    this.#rscBuilder = new RSCBuilder({
      entriesBuilder: this.#entriesBuilder,
    });
    this.#clientAppBuilder = new ClientAppBuilder({
      entriesBuilder: this.#entriesBuilder,
    });
    this.#staticFilesBuilder = new StaticFilesBuilder();
  }

  get isBuilding() {
    return this.#isBuilding;
  }

  get key() {
    return this.#key;
  }

  async setup() {
    await this.#entriesBuilder.setup();
    await this.#errorPageBuilder.setup();
  }

  get error() {
    return this.#rscBuilder.error || this.#clientAppBuilder.error;
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
    performance.mark("build start");

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

    await this.#entriesBuilder.build();

    await this.#errorPageBuilder.build();
    await this.#staticFilesBuilder.build();

    await this.#rscBuilder.build();
    await this.#clientAppBuilder.build();

    this.#key = randomBytes(6).toString("hex");

    performance.mark("build end");

    let measure = performance.measure(
      "build duration",
      "build start",
      "build end",
    );
    let rebuildTime = measure.duration;

    console.log(
      `🏗️  Built app in ${rebuildTime.toFixed(2)}ms [version: ${this.#key}]`,
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
