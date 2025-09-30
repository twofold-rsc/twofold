import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { ProductionBuild } from "../build/build/production.js";
import { DevelopmentBuild } from "../build/build/development.js";

type Build = DevelopmentBuild | ProductionBuild;

export class ServeTask {
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

    await this.#build.load();

    console.log(`Loaded build [version: ${this.#build.key}]`);

    await this.#server.start();
    await this.#runtime.start();
    await this.#build.warm();

    process.on("SIGTERM", () => {
      console.log("Received SIGTERM, shutting down gracefully");
      this.stop();
    });

    console.log(
      `Server started on ${this.#runtime.hostname}:${this.#runtime.port}`,
    );
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

  private async stop() {
    const timeoutId = setTimeout(() => {
      console.error("Force shutdown since server did not stop within 9s");
      process.exit(1);
    }, 9_000);

    await this.#server.gracefulShutdown();

    clearTimeout(timeoutId);
    process.exit(0);
  }
}
