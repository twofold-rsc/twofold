// import { getSSRStore } from "./stores/ssr-store.js";
// import { AsyncLocalStorage } from "async_hooks";

// needed for server.edge
// globalThis.AsyncLocalStorage = AsyncLocalStorage;

type Resolvers = {
  moduleIdToPath: (moduleId: string) => string | undefined;
};

let resolvers: Resolvers = {
  // hacky way to inject the client component module map here so
  // these webpack globals can use it.
  moduleIdToPath: () => undefined,
};

export function injectResolver(resolver: (module: string) => string) {
  resolvers.moduleIdToPath = resolver;
}

let moduleMap = new Map();

// @ts-ignore
globalThis.__webpack_chunk_load__ = async function (chunkId: string) {
  // console.log("*** server loading chunk", chunkId);

  let [moduleId, name, browserHash, serverHash] = chunkId.split(":");
  let modulePath = resolvers.moduleIdToPath(moduleId);
  if (!modulePath) {
    throw new Error(`Failed to resolve module id ${moduleId}`);
  }

  // console.log("*** resolved to", modulePath);

  let mod = await import(modulePath);

  // let ssrStore = getSSRStore();
  // if (ssrStore) {
  //   ssrStore.chunks.push(id);
  // }

  moduleMap.set(moduleId, mod);
  return mod;
};

// @ts-ignore
globalThis.__webpack_require__ = function (id: string) {
  let [moduleId, exportName] = id.split("#");
  // console.log("*** server require", id);
  return moduleMap.get(moduleId);
};
