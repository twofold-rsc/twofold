import { cwdUrl } from "../files.js";
import { watch, glob, stat, readFile } from "fs/promises";
import dotenv from "dotenv";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";
import { minimatch } from "minimatch";
import { createHash, randomBytes } from "crypto";
import kleur from "kleur";
import chokidar from "chokidar";
import { Watcher } from "../build/watcher.js";

type Build = DevelopmentBuild | ProductionBuild;

export class DevTask {
  #build: Build;
  #runtime: Runtime;
  #server: Server;

  constructor({ build, port }: { build: Build; port: number }) {
    this.#build = build;
    this.#runtime = new Runtime(build);
    this.#server = new Server(this.#runtime, {
      hostname: "0.0.0.0",
      port,
    });
  }

  async start() {
    this.verifyEnv();

    await this.#build.setup();
    await this.#server.start();

    console.log(
      `Server started on ${this.#server.hostname}:${this.#server.port}`,
    );

    let build = await this.#build.build();
    console.log(
      `Built app in ${kleur.green(`${build.time.toFixed(2)}ms`)} [version: ${kleur.yellow(build.key)}]`,
    );

    await this.#runtime.start();

    console.log(
      `Visit ${kleur.cyan(`${this.#server.baseUrl}/`)} to see your app!`,
    );

    this.watch();

    process.on("SIGINT", () => {
      console.log("Exiting");
      process.exit(0);
    });
  }

  private verifyEnv() {
    let key = process.env.TWOFOLD_SECRET_KEY;

    if (!key || typeof key !== "string") {
      console.warn(
        `Missing ${kleur.yellow("TWOFOLD_SECRET_KEY")}. Generating a random key.`,
      );
      process.env.TWOFOLD_SECRET_KEY = randomBytes(32).toString("hex");
    }
  }

  private async restart() {
    await this.#runtime.stop();
    await this.#build.stop();
    await this.#server.hardStop();

    await this.#build.setup();
    await this.#server.start();

    console.log(
      `Server restarted on ${this.#server.hostname}:${this.#server.port}`,
    );

    let build = await this.#build.build();
    console.log(
      `Built app in ${kleur.green(`${build.time.toFixed(2)}ms`)} [version: ${kleur.yellow(build.key)}]`,
    );

    await this.#runtime.start();
  }

  private async rebuild() {
    await this.#runtime.stop();

    let build = await this.#build.build();
    console.log(
      `Built app in ${kleur.green(`${build.time.toFixed(2)}ms`)} [version: ${kleur.yellow(build.key)}]`,
    );

    await this.#runtime.start();
  }

  private async reloadEnv() {
    await this.#runtime.stop();
    dotenv.config({
      override: true,
      quiet: true,
    });
    await this.#build.build();
    await this.#runtime.start();

    console.log("Reloaded environment variables");
  }

  private async watch() {
    let watcher = new Watcher({
      routes: [
        {
          patterns: ["app/**/*", "lib/**/*", "public/**/*"],
          callback: () => this.rebuild(),
        },
        {
          patterns: ["config/**/*", "package.json"],
          callback: () => this.restart(),
        },
        {
          patterns: ["**/*.{js,jsx,ts,tsx}"],
          callback: () => this.rebuild(),
        },
        {
          patterns: [".env"],
          callback: () => this.reloadEnv(),
        },
      ],
      ignores: [
        ".twofold/**/*",
        "node_modules/**/*",
        ".git/**/*",
        "**/*~",
        "**/*.swp",
      ],
    });

    await watcher.start();
  }
}
