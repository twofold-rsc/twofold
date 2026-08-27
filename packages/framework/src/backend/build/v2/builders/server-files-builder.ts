import { copyFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
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
    let errorHtmlUrl = new URL("./error.html", dir);

    await mkdir(dir, { recursive: true });
    await copyFile(errorFile, errorHtmlUrl);

    return new ServerFilesOutput({
      errorHtmlPath: fileURLToPath(errorHtmlUrl),
    });
  }

  load(data: ReturnType<ServerFilesOutput["serialize"]>) {
    return new ServerFilesOutput({
      errorHtmlPath: data.errorHtmlPath,
    });
  }
}

export class ServerFilesOutput {
  readonly errorHtmlPath: string;

  constructor({ errorHtmlPath }: { errorHtmlPath: string }) {
    this.errorHtmlPath = errorHtmlPath;
  }

  serialize() {
    return {
      errorHtmlPath: this.errorHtmlPath,
    };
  }

  warm() {}
}
