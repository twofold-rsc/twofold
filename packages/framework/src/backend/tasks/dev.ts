import { cwdUrl } from "../files.js";
import { watch } from "fs/promises";
import dotenv from "dotenv";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";
import { minimatch } from "minimatch";
import { randomBytes } from "crypto";
import kleur from "kleur";

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
      `Server started on ${this.#runtime.hostname}:${this.#runtime.port}`,
    );

    let build = await this.#build.build();
    console.log(
      `Built app in ${kleur.green(`${build.time.toFixed(2)}ms`)} [version: ${kleur.yellow(build.key)}]`,
    );

    await this.#runtime.start();

    console.log(
      `Visit ${kleur.cyan(`${this.#runtime.baseUrl}/`)} to see your app!`,
    );

    this.watch();
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
      `Server restarted on ${this.#runtime.hostname}:${this.#runtime.port}`,
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
    let matchers: [string, () => void | Promise<void>][] = [
      ["app/**/*", () => this.rebuild()],
      ["lib/**/*", () => this.rebuild()],
      ["config/**/*", () => this.restart()],
      ["public/**/*", () => this.rebuild()],
      [".env", () => this.reloadEnv()],
      ["package.json", () => this.restart()],
      [".twofold/**/*", () => {}],
      ["node_modules/**/*", () => {}],
      [".git/**/*", () => {}],
      ["**/*.{js,jsx,ts,tsx}", () => this.rebuild()],
    ];

    (async () => {
      let watched = watch(cwdUrl, { recursive: true });
      for await (let { filename } of watched) {
        if (filename) {
          let matchResult = matchers.find(([match]) =>
            minimatch(filename, match),
          );

          if (matchResult) {
            let [match, callback] = matchResult;

            // if (match !== ".twofold/**/*") {
            //   console.log({
            //     filename,
            //     match,
            //     callback,
            //     eventType,
            //   });
            // }

            // we should buffer for a few ms before running this callback
            await callback();
          }
        }
      }
    })();
  }
}
