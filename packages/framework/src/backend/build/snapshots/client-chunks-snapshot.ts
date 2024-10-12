type Chunk = { file: string };

export class ClientChunksSnapshot {
  #snapshot: Chunk[] = [];
  #latest: Chunk[] = [];

  take(outputs: Chunk[]) {
    this.#snapshot = outputs;
  }

  latest(outputs: Chunk[]) {
    this.#latest = outputs;
  }

  get chunkFiles() {
    let previousSet = new Set(this.#snapshot.map((chunk) => chunk.file));

    let addedOutputs = this.#latest
      .map((chunk) => chunk.file)
      .filter((path) => !previousSet.has(path));

    return {
      added: addedOutputs,
    };
  }
}
