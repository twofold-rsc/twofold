type ClientComponentMap = {
  [key: string]: {
    chunks: string[];
  };
};

export class ClientComponentMapSnapshot {
  #snapshot: ClientComponentMap = {};
  #latest: ClientComponentMap = {};

  take(map: ClientComponentMap) {
    this.#snapshot = map;
  }

  latest(map: ClientComponentMap) {
    this.#latest = map;
  }

  get chunkIds() {
    let snapshotChunks = getChunkSetFromClientComponentMap(this.#snapshot);
    let latestChunks = getChunkSetFromClientComponentMap(this.#latest);

    let addedChunks = [...latestChunks].filter(
      (chunk) => !snapshotChunks.has(chunk),
    );

    return {
      added: addedChunks,
    };
  }
}

function getChunkSetFromClientComponentMap(
  clientComponentMap: ClientComponentMap,
) {
  let chunks = new Set();
  for (let key of Object.keys(clientComponentMap)) {
    let component = clientComponentMap[key];
    if (component.chunks) {
      chunks.add(component.chunks[0]);
    }
  }
  return chunks;
}
