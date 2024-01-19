import { AsyncLocalStorage } from "node:async_hooks";

type SSRStore = {
  chunks: string[];
};

export const asyncLocalStorage = new AsyncLocalStorage<SSRStore>();

export function getSSRStore() {
  let store = asyncLocalStorage.getStore();
  return store;
}

export function runSSRStore<T>(store: SSRStore, fn: () => T): T {
  return asyncLocalStorage.run(store, fn);
}
