import { ReadOnlyFile } from "@hattip/static";
import { access, readdir, stat } from "fs/promises";
import * as path from "path";
import { cwdUrl } from "../../files.js";
import { fileURLToPath } from "url";
import { Stats } from "fs";
import * as mime from "mime-types";
import etag from "etag";
import { Builder } from "./builder.js";

export class StaticFilesBuilder extends Builder {
  readonly name = "static-files";

  #staticUrl = new URL("./public", cwdUrl);
  #fileMap: Map<string, ReadOnlyFile> = new Map();

  async exists() {
    try {
      await access(this.#staticUrl);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async setup() {}

  async build() {
    let exists = await this.exists();
    if (exists) {
      this.clear();
      let files = await statsUnderPath(fileURLToPath(this.#staticUrl));
      for (let file of files) {
        this.addFile(file);
      }
    }
  }

  async stop() {}

  serialize() {
    return {
      fileMap: Object.fromEntries(this.#fileMap.entries()),
    };
  }

  load(data: any) {
    this.#fileMap = new Map(Object.entries(data.fileMap));
  }

  async addFile(file: File) {
    let filePath = file.path.slice(fileURLToPath(this.#staticUrl).length);
    let httpPath = filePath.split(path.sep).join("/");

    this.#fileMap.set(httpPath, {
      path: filePath,
      type: mime.contentType(path.extname(file.path)) || "",
      size: file.stats.size,
      etag: etag(file.stats),
    });
  }

  get fileMap() {
    return this.#fileMap;
  }

  clear() {
    this.#fileMap.clear();
  }
}

type File = {
  path: string;
  stats: Stats;
};

async function statsUnderPath(dir: string): Promise<File[]> {
  let dirContents = await readdir(dir);
  let files: File[] = [];

  for await (let item of dirContents) {
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
