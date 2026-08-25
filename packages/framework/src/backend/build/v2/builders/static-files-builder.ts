import type { ReadOnlyFile } from "@hattip/static";
import etag from "etag";
import type { Stats } from "fs";
import { access, readdir, stat } from "fs/promises";
import * as mime from "mime-types";
import * as path from "path";
import { fileURLToPath } from "url";
import { Builder } from "./builder.js";

type StaticFilesBuilderInput = {
  readonly publicRoot: URL;
};

export class StaticFilesBuilder extends Builder<
  StaticFilesBuilderInput,
  StaticFilesOutput
> {
  async build({ publicRoot }: StaticFilesBuilderInput) {
    let fileMap = new Map<string, ReadOnlyFile>();

    try {
      await access(publicRoot);
    } catch (_error) {
      return new StaticFilesOutput(fileMap);
    }

    let rootPath = path.resolve(fileURLToPath(publicRoot));
    let files = await statsUnderPath(rootPath);

    for (let file of files) {
      let filePath = file.path.slice(rootPath.length);
      let httpPath = filePath.split(path.sep).join("/");

      fileMap.set(httpPath, {
        path: filePath,
        type: mime.contentType(path.extname(file.path)) || "",
        size: file.stats.size,
        etag: etag(file.stats),
      });
    }

    return new StaticFilesOutput(fileMap);
  }

  load(data: ReturnType<StaticFilesOutput["serialize"]>) {
    return new StaticFilesOutput(new Map(Object.entries(data.fileMap)));
  }
}

class StaticFilesOutput {
  readonly fileMap: ReadonlyMap<string, ReadOnlyFile>;

  constructor(fileMap: ReadonlyMap<string, ReadOnlyFile>) {
    this.fileMap = fileMap;
  }

  serialize() {
    return {
      fileMap: Object.fromEntries(this.fileMap.entries()),
    };
  }

  warm() {}
}

type File = {
  path: string;
  stats: Stats;
};

async function statsUnderPath(dir: string): Promise<File[]> {
  let dirContents = await readdir(dir);
  let files: File[] = [];

  for (let item of dirContents) {
    let itemPath = path.join(dir, item);
    let itemStat = await stat(itemPath);

    if (itemStat.isDirectory()) {
      let subDirItems = await statsUnderPath(itemPath);
      files = [...files, ...subDirItems];
    } else {
      files.push({
        path: itemPath,
        stats: itemStat,
      });
    }
  }

  return files;
}
