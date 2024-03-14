import { RequestContextExtensions } from "@hattip/compose";
import { AsyncLocalStorage } from "node:async_hooks";

type Store = {
  reqId: number;
  cookies: {
    get: (key: string) => string | undefined;
    set: RequestContextExtensions["setCookie"];
    destroy: RequestContextExtensions["deleteCookie"];
    outgoingCookies: RequestContextExtensions["outgoingCookies"];
  };
  assets: string[];
};

let asyncLocalStorage = new AsyncLocalStorage<Store>();

export function runStore<T>(store: Store, fn: () => Promise<T>) {
  return asyncLocalStorage.run(store, fn);
}

export function getStore() {
  let store = asyncLocalStorage.getStore();

  if (!store) {
    throw new Error("store used outside of render");
  }

  return store;
}
