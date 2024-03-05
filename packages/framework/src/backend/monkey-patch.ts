// import { getSSRStore } from "./stores/ssr-store.js";
import { AsyncLocalStorage as NodeAsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";

declare global {
  var AsyncLocalStorage: typeof NodeAsyncLocalStorage;
  var __webpack_chunk_load__: (chunkId: string) => Promise<any>;
  var __webpack_require__: (id: string) => any;
  var __non_webpack_require__: ReturnType<typeof createRequire>;
}

globalThis.AsyncLocalStorage = NodeAsyncLocalStorage;

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

globalThis.__webpack_chunk_load__ = async function (chunkId: string) {
  console.log("*** server loading chunk", chunkId);

  let [moduleId, name, browserHash, serverHash] = chunkId.split(":");
  let modulePath = resolvers.moduleIdToPath(moduleId);
  if (!modulePath) {
    throw new Error(`Failed to resolve module id ${moduleId}`);
  }

  console.log("*** resolved to", modulePath);

  let mod = await import(modulePath);

  // let ssrStore = getSSRStore();
  // if (ssrStore) {
  //   ssrStore.chunks.push(id);
  // }

  moduleMap.set(moduleId, mod);
  return mod;
};

globalThis.__webpack_require__ = function (id: string) {
  let [moduleId, exportName] = id.split("#");
  // console.log("*** server require", id);
  return moduleMap.get(moduleId);
};

globalThis.__non_webpack_require__ = createRequire(import.meta.url);
