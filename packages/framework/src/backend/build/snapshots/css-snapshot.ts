import { basename } from "node:path";

type File = string;

export class CSSSnapshot {
  #snapshot: File[] = [];
  #latest: File[] = [];

  take(files: File[]) {
    this.#snapshot = files;
  }

  latest(files: File[]) {
    this.#latest = files;
  }

  get cssFiles() {
    let previousSet = new Set(this.#snapshot);
    let latestSet = new Set(this.#latest);

    let added = this.#latest
      .filter((file) => file.endsWith(".css") && !previousSet.has(file))
      .map((file) => basename(file));

    let removed = this.#snapshot
      .filter((file) => file.endsWith(".css") && !latestSet.has(file))
      .map((file) => basename(file));

    return {
      added,
      removed,
    };
  }
}
