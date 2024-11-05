import { cwdUrl } from "../files.js";
import { stat, watch } from "fs/promises";
import { watchFile } from "fs";
import dotenv from "dotenv";
import { logger } from "./helpers/logger.js";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";

type Build = DevelopmentBuild | ProductionBuild;

export class DevTask {
  #build: Build;
  #runtime: Runtime;
  #server: Server;

  constructor({ build }: { build: Build }) {
    this.#build = build;
    this.#runtime = new Runtime(build);
    this.#server = new Server(this.#runtime);
  }

  async start() {
    await this.#build.setup();
    await this.#server.start();

    console.log(
      `🚀 Server started on ${this.#runtime.hostname}:${this.#runtime.port}`,
    );

    let build = await this.#build.build();
    logger.build(build);

    await this.#runtime.start();

    let cyan = "\x1b[0;36m";
    let reset = "\x1b[0m";
    console.log(
      `🌎 Visit ${cyan}${this.#runtime.baseUrl}/ ${reset}to see your app!`,
    );

    this.watch();
  }

  private async restart() {
    await this.#runtime.stop();
    await this.#build.stop();
    await this.#server.stop();

    await this.#build.setup();
    await this.#server.start();

    console.log(
      `🚀 Server restarted on ${this.#runtime.hostname}:${this.#runtime.port}`,
    );

    let build = await this.#build.build();
    logger.build(build);

    await this.#runtime.start();
  }

  private async rebuild() {
    await this.#runtime.stop();

    let build = await this.#build.build();
    logger.build(build);

    await this.#runtime.start();
  }

  private async reloadEnv() {
    await this.#runtime.stop();
    dotenv.config({ override: true });
    await this.#build.build();
    await this.#runtime.start();

    console.log(`🕵️  Reloaded environment variables`);
  }

  private async watch() {
    let files = {
      "./src": () => this.rebuild(),
      "./public": () => this.rebuild(),
      "./config": () => this.restart(),
      "./.env": () => this.reloadEnv(),
    };

    Object.entries(files).forEach(async ([fileOrDir, callback]) => {
      let url = new URL(fileOrDir, cwdUrl);
      let watchType: "file" | "directory" | "none" = "none";
      try {
        let stats = await stat(url);
        if (stats.isDirectory()) {
          watchType = "directory";
        } else if (stats.isFile()) {
          watchType = "file";
        }
      } catch (_e) {
        watchType = "none";
      }

      if (watchType === "directory" || watchType === "file") {
        let watched = watch(fileOrDir, {
          recursive: watchType === "directory",
        });
        for await (let _event of watched) {
          await callback();
        }
      }
    });
  }
}
