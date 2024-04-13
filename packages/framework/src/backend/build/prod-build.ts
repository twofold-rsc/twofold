import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { appCompiledDir } from "../files.js";
import { randomBytes } from "node:crypto";
import { ClientAppBuilder } from "./builders/client-app-builder.js";
import { RSCBuilder } from "./builders/rsc-builder.js";
import { StaticFilesBuilder } from "./builders/static-files-builder.js";
import { EntriesBuilder } from "./builders/entries-builder.js";
import { time } from "./helpers/time.js";
import { ServerFilesBuilder } from "./builders/server-files-builder.js";

export class ProdBuild {
  readonly env = "production";

  #key = randomBytes(6).toString("hex");
  #entriesBuilder: EntriesBuilder;
  #rscBuilder: RSCBuilder;
  #clientAppBuilder: ClientAppBuilder;
  #serverFilesBuilder: ServerFilesBuilder;
  #staticFilesBuilder: StaticFilesBuilder;

  constructor() {
    this.#entriesBuilder = new EntriesBuilder();
    this.#rscBuilder = new RSCBuilder({
      entriesBuilder: this.#entriesBuilder,
    });
    this.#clientAppBuilder = new ClientAppBuilder({
      env: "production",
      entriesBuilder: this.#entriesBuilder,
    });
    this.#serverFilesBuilder = new ServerFilesBuilder({ env: "production" });
    this.#staticFilesBuilder = new StaticFilesBuilder();
  }

  get key() {
    return this.#key;
  }

  async setup() {
    await rm(appCompiledDir, { recursive: true, force: true });
    await this.#entriesBuilder.setup();
    await this.#serverFilesBuilder.setup();
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
      static: this.#staticFilesBuilder,
    };
  }

  async build() {
    let buildTime = time("build");
    buildTime.start();

    let entriesBuild = this.#entriesBuilder.build();
    let staticFilesBuild = this.#staticFilesBuilder.build();
    let serverFilesBuild = this.#serverFilesBuilder.build();

    let frameworkTime = time("framework build");
    frameworkTime.start();
    await Promise.all([entriesBuild, serverFilesBuild, staticFilesBuild]);
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
  }

  async stop() {
    await this.#entriesBuilder.stop();
    await this.#serverFilesBuilder.stop();
    await this.#rscBuilder.stop();
    await this.#clientAppBuilder.stop();
  }

  async save() {
    // make sure there are no errors
    let entriesBuild = this.#entriesBuilder.serialize();
    let rscBuild = this.#rscBuilder.serialize();
    let clientBuild = this.#clientAppBuilder.serialize();

    let json = JSON.stringify(
      {
        key: this.#key,
        entriesBuild,
        rscBuild,
        clientBuild,
      },
      null,
      2,
    );

    let buildJsonUrl = new URL("./build.json", appCompiledDir);

    await writeFile(buildJsonUrl, json, "utf-8");
  }

  async load() {
    let buildJsonUrl = new URL("./build.json", appCompiledDir);

    let json = await readFile(buildJsonUrl, "utf-8");
    let buildData = JSON.parse(json);

    this.#key = buildData.key;
    this.#entriesBuilder.load(buildData.entriesBuild);
    this.#rscBuilder.load(buildData.rscBuild);
    this.#clientAppBuilder.load(buildData.clientBuild);
  }
}
