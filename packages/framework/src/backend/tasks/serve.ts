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
    await this.#build.load();

    console.log(`Loaded build [version: ${this.#build.key}]`);

    await this.#server.start();
    await this.#runtime.start();

    console.log(
      `Server started on ${this.#runtime.hostname}:${this.#runtime.port}`,
    );
  }
}
