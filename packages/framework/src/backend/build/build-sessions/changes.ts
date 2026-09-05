import { basename } from "node:path";
import type { ClientOutput } from "../builders/client-builder.js";
import type { RSCOutput } from "../builders/rsc-builder.js";

type ChangeOutputs = {
  readonly client: ClientOutput;
  readonly rsc: RSCOutput;
};

export type BuildChanges = {
  readonly chunkIds: { readonly added: readonly string[] };
  readonly chunkFiles: { readonly added: readonly string[] };
  readonly rscFiles: { readonly added: readonly string[] };
  readonly cssFiles: {
    readonly added: readonly string[];
    readonly removed: readonly string[];
  };
};

export function getBuildChanges(
  previous: ChangeOutputs | undefined,
  current: ChangeOutputs,
): BuildChanges {
  if (!previous) {
    return {
      chunkIds: { added: [] },
      chunkFiles: { added: [] },
      rscFiles: { added: [] },
      cssFiles: { added: [], removed: [] },
    };
  }

  let previousChunkIds = getClientComponentChunkIds(previous);
  let currentChunkIds = getClientComponentChunkIds(current);
  let previousChunkFiles = previous.client.chunks.map((chunk) => chunk.file);
  let currentChunkFiles = current.client.chunks.map((chunk) => chunk.file);
  let previousRSCFiles = previous.rsc.files.filter((file) =>
    file.endsWith(".js"),
  );
  let currentRSCFiles = current.rsc.files.filter((file) =>
    file.endsWith(".js"),
  );
  let previousCSSFiles = previous.rsc.files.filter((file) =>
    file.endsWith(".css"),
  );
  let currentCSSFiles = current.rsc.files.filter((file) =>
    file.endsWith(".css"),
  );

  return {
    chunkIds: { added: added(previousChunkIds, currentChunkIds) },
    chunkFiles: { added: added(previousChunkFiles, currentChunkFiles) },
    rscFiles: {
      added: added(previousRSCFiles, currentRSCFiles).map((file) =>
        basename(file),
      ),
    },
    cssFiles: {
      added: added(previousCSSFiles, currentCSSFiles).map((file) =>
        basename(file),
      ),
      removed: added(currentCSSFiles, previousCSSFiles).map((file) =>
        basename(file),
      ),
    },
  };
}

function getClientComponentChunkIds(outputs: ChangeOutputs) {
  let chunkIds: string[] = [];

  for (let component of Object.values(outputs.client.clientComponentMap)) {
    let chunkId = component.chunks[0];
    if (chunkId !== undefined) {
      chunkIds.push(chunkId);
    }
  }

  return chunkIds;
}

function added(previous: readonly string[], current: readonly string[]) {
  let previousSet = new Set(previous);
  return current.filter((value) => !previousSet.has(value));
}
