import { basename } from "node:path";

type File = string;

export class RSCSnapshot {
  #snapshot: File[] = [];
  #latest: File[] = [];

  take(files: File[]) {
    this.#snapshot = files;
  }

  latest(files: File[]) {
    this.#latest = files;
  }

  get rscFiles() {
    let previousSet = new Set(this.#snapshot);

    let added = this.#latest
      .filter((file) => file.endsWith(".js") && !previousSet.has(file))
      .map((file) => basename(file));

    return {
      added: added,
    };
  }
}
