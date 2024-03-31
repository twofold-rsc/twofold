import { copyFile, mkdir } from "fs/promises";
import { appCompiledDir, frameworkSrcDir } from "../../files.js";

let devFile = new URL("./apps/errors/index.html", frameworkSrcDir);
let prodFile = new URL("./backend/server/internal-error.html", frameworkSrcDir);

export class ServerFilesBuilder {
  #env: "development" | "production";

  constructor({ env }: { env: "development" | "production" }) {
    this.#env = env;
  }

  async setup() {
    let dir = new URL("./server-files/", appCompiledDir);
    await mkdir(dir, { recursive: true });
  }

  async build() {
    let errorFile = this.#env === "development" ? devFile : prodFile;
    await copyFile(
      errorFile,
      new URL("./server-files/error.html", appCompiledDir),
    );
  }
}
