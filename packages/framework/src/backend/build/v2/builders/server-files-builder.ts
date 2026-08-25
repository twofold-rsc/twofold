import { copyFile, mkdir } from "fs/promises";
import { appCompiledDir, frameworkSrcDir } from "../../../files.js";
import { Builder } from "./builder.js";

let devFile = new URL("./client/apps/errors/index.html", frameworkSrcDir);
let prodFile = new URL("./backend/server/internal-error.html", frameworkSrcDir);

type ServerFilesBuilderInput = {
  readonly environment: "development" | "production";
};

export class ServerFilesBuilder extends Builder<
  ServerFilesBuilderInput,
  ServerFilesOutput
> {
  async build({ environment }: ServerFilesBuilderInput) {
    let dir = new URL("./server-files/", appCompiledDir);
    let errorFile = environment === "development" ? devFile : prodFile;

    await mkdir(dir, { recursive: true });
    await copyFile(errorFile, new URL("./error.html", dir));

    return new ServerFilesOutput();
  }

  load(_data: ReturnType<ServerFilesOutput["serialize"]>) {
    return new ServerFilesOutput();
  }
}

class ServerFilesOutput {
  serialize() {
    return {};
  }

  warm() {}
}
