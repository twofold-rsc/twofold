import { ReadOnlyFile } from "@hattip/static";
import { access, readdir, stat } from "fs/promises";
import * as path from "path";
import { cwdUrl } from "../../files.js";
import { fileURLToPath } from "url";
import { Stats } from "fs";
import * as mime from "mime-types";
import etag from "etag";

export class StaticFilesBuilder {
  #staticUrl = new URL("./public", cwdUrl);
  #fileMap: Map<string, ReadOnlyFile> = new Map();

  async exists() {
    try {
      await access(this.#staticUrl);
      return true;
    } catch (error) {
      return false;
    }
  }

  async build() {
    let exists = await this.exists();
    if (exists) {
      let files = await statsUnderPath(this.#staticUrl.pathname);
      for (let file of files) {
        this.addFile(file);
      }
    }
  }

  async stop() {}

  async addFile(file: File) {
    let httpPath = file.path.slice(fileURLToPath(this.#staticUrl).length);

    this.#fileMap.set(httpPath, {
      path: httpPath,
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
