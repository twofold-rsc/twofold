import dotenv from "dotenv";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";
import { randomBytes } from "crypto";
import kleur from "kleur";
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

    void this.watch();

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
    let pending = new Set<() => Promise<void>>();
    let work = new CoalescingTask(async () => {
      let actions = pending;
      pending = new Set();

      for (let action of actions) {
        await action();
      }
    });

    let schedule = (action: () => Promise<void>) => {
      if (!pending.has(action)) {
        pending.add(action);
      }

      return work.run();
    };

    let rebuild = () => this.rebuild();
    let restart = () => this.restart();
    let reloadEnv = () => this.reloadEnv();

    let watcher = new Watcher({
      routes: [
        {
          patterns: ["app/**/*", "lib/**/*", "public/**/*"],
          callback: () => schedule(rebuild),
        },
        {
          patterns: ["config/**/*", "package.json"],
          callback: () => schedule(restart),
        },
        {
          patterns: ["**/*.{js,jsx,ts,tsx}"],
          callback: () => schedule(rebuild),
        },
        {
          patterns: [".env"],
          callback: () => schedule(reloadEnv),
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

class CoalescingTask {
  #running: Promise<void> | undefined;
  #rerun = false;

  constructor(private action: () => Promise<void>) {}

  run() {
    if (this.#running) {
      this.#rerun = true;
      return this.#running;
    }

    this.#running = this.runUntilCurrent();
    return this.#running;
  }

  private async runUntilCurrent() {
    try {
      do {
        this.#rerun = false;
        await this.action();
      } while (this.#rerun);
    } finally {
      this.#running = undefined;
    }
  }
}
