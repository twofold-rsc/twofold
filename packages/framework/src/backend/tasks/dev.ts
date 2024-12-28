import { cwdUrl } from "../files.js";
import { stat, watch } from "fs/promises";
import dotenv from "dotenv";
import { logger } from "./helpers/logger.js";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";
import { fileURLToPath } from "url";
import path from "path";
import { minimatch } from "minimatch";

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
    this.verifyEnv();

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

  private verifyEnv() {
    let key = process.env.TWOFOLD_SECRET_KEY;

    // validate
    if (!key || typeof key !== "string") {
      throw new Error(
        "process.env.TWOFOLD_SECRET_KEY is required. Please set it to a string.",
      );
    }
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
      "app/**/*": () => this.rebuild(),
      "lib/**/*": () => this.rebuild(),
      "config/**/*": () => this.restart(),
      "public/**/*": () => this.rebuild(),
      ".env": () => this.reloadEnv(),
      "package.json": () => this.restart(),
      ".twofold/**/*": () => {},
      "node_modules/**/*": () => {},
      ".git/**/*": () => {},
      "**/*.{js,jsx,ts,tsx}": () => this.rebuild(),
    };

    (async () => {
      let watched = watch(cwdUrl, { recursive: true });
      for await (let { filename } of watched) {
        if (filename) {
          let matchResult = Object.entries(files).find(([match]) =>
            minimatch(filename, match),
          );

          if (matchResult) {
            let [match, callback] = matchResult;
            // if (match !== ".twofold/**/*") {
            //   console.log({ filename, match, callback });
            // }
            // we should buffer for a few ms before running this callback
            await callback();
          }
        }
      }
    })();
  }
}
