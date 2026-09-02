import dotenv from "dotenv";
import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { randomBytes } from "crypto";
import kleur from "kleur";
import { Watcher } from "../build/watcher.js";
import { BuildSession } from "../build/v2/build-sessions/build-session.js";

export class DevTask {
  #buildSession: BuildSession<"development" | "production">;

  #runtime: Runtime | undefined;
  #server: Server;

  constructor({
    buildSession,
    port,
  }: {
    buildSession: BuildSession<"development" | "production">;
    port: number;
  }) {
    this.#buildSession = buildSession;

    this.#server = new Server({
      address: "0.0.0.0",
      port,
      enableDevReload: true,
    });
  }

  async start() {
    this.verifyEnv();

    this.#server.buildStarted();

    await this.#buildSession.setup();

    let config = await this.#buildSession.getAppConfig();

    await this.#server.start({
      trustProxy: config.trustProxy,
    });

    console.log(
      `Server started on ${this.#server.address}:${this.#server.port}`,
    );
    console.log(
      `Visit ${kleur.cyan(`${this.#server.baseUrl}/`)} to see your app!`,
    );

    let buildResult = await this.#buildSession.build();

    console.log(
      `Built app in ${kleur.green(`${buildResult.duration.toFixed(2)}ms`)} [version: ${kleur.yellow(buildResult.key)}]`,
    );

    if (buildResult.status === "success") {
      this.#runtime = new Runtime(buildResult);
      await this.#runtime.start();

      this.#server.installRuntime(this.#runtime);
    }

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
    // TODO: i think we should stop listening for changes, or something. we cant build here.

    this.#server.buildStarted();

    await this.#runtime?.stop();
    await this.#server.hardStop();

    // start rebuilding...
    // this is very similar to start, can we invoke start again?

    await this.#buildSession.setup();

    let config = await this.#buildSession.getAppConfig();

    await this.#server.start({
      trustProxy: config.trustProxy,
    });

    console.log(
      `Server restarted on ${this.#server.address}:${this.#server.port}`,
    );

    let buildResult = await this.#buildSession.build();

    console.log(
      `Built app in ${kleur.green(`${buildResult.duration.toFixed(2)}ms`)} [version: ${kleur.yellow(buildResult.key)}]`,
    );

    if (buildResult.status === "success") {
      this.#runtime = new Runtime(buildResult);
      await this.#runtime.start();

      this.#server.installRuntime(this.#runtime);
    }
  }

  private async rebuild() {
    this.#server.buildStarted();

    await this.#runtime?.stop();

    let buildResult = await this.#buildSession.build();
    console.log(
      `Built app in ${kleur.green(`${buildResult.duration.toFixed(2)}ms`)} [version: ${kleur.yellow(buildResult.key)}]`,
    );

    if (buildResult.status === "success") {
      this.#runtime = new Runtime(buildResult);
      await this.#runtime.start();

      this.#server.installRuntime(this.#runtime);
    }
  }

  private async reloadEnv() {
    this.#server.buildStarted();

    await this.#runtime?.stop();

    dotenv.config({
      override: true,
      quiet: true,
    });

    let buildResult = await this.#buildSession.build();

    console.log("Reloaded environment variables");
    console.log(
      `Built app in ${kleur.green(`${buildResult.duration.toFixed(2)}ms`)} [version: ${kleur.yellow(buildResult.key)}]`,
    );

    if (buildResult.status === "success") {
      this.#runtime = new Runtime(buildResult);
      await this.#runtime.start();

      this.#server.installRuntime(this.#runtime);
    }
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
