import { copyFile, mkdir } from "fs/promises";
import { appCompiledDir, frameworkSrcDir } from "../../files.js";
import { Builder } from "./builder.js";
import { Environment } from "../environments/environment.js";

let devFile = new URL("./apps/errors/index.html", frameworkSrcDir);
let prodFile = new URL("./backend/server/internal-error.html", frameworkSrcDir);

export class ServerFilesBuilder extends Builder {
  readonly name = "server-files";

  #environment: Environment;

  constructor({ environment }: { environment: Environment }) {
    super();
    this.#environment = environment;
  }

  get #env() {
    return this.#environment.name;
  }

  async setup() {
    let dir = new URL("./server-files/", appCompiledDir);
    await mkdir(dir, { recursive: true });
  }

  async build() {
    let errorFile = this.#env === "development" ? devFile : prodFile;
    await copyFile(
      errorFile,
      new URL("./server-files/error.html", appCompiledDir)
    );
  }

  async stop() {}

  serialize() {
    return {};
  }

  load(data: any) {}
}
