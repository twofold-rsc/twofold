import { Runtime } from "../runtime.js";
import { Server } from "../server.js";
import { BuildSession } from "../build/v2/build-sessions/build-session.js";

export class ServeTask {
  #buildSession: BuildSession<"development"> | BuildSession<"production">;
  // #runtime: Runtime;
  #server: Server;

  constructor({
    buildSession,
    port,
  }: {
    buildSession: BuildSession<"development"> | BuildSession<"production">;
    port: number;
  }) {
    this.#buildSession = buildSession;
    this.#server = new Server({
      address: "0.0.0.0",
      port,
      enableDevReload: false,
    });
  }

  async start() {
    this.verifyEnv();

    let buildResult = await this.#buildSession.load();
    await buildResult.warm();

    console.log(`Loaded build [version: ${buildResult.key}]`);

    let generation = this.#server.createGeneration();
    let config = await this.#buildSession.getAppConfig();

    await this.#server.start({
      trustProxy: config.trustProxy,
    });

    let runtime = new Runtime(buildResult);
    await runtime.start();
    generation.installRuntime(runtime);

    process.on("SIGTERM", () => {
      console.log("Received SIGTERM, shutting down gracefully");
      void this.stop();
    });

    console.log(
      `Server started on ${this.#server.address}:${this.#server.port}`,
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
