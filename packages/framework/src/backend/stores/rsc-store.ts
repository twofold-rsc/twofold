import { RequestContextExtensions } from "@hattip/compose";
import { AsyncLocalStorage } from "node:async_hooks";
import { ReactNode } from "react";

export type Store = {
  reqId: number;
  build: "development" | "production";
  canReload: boolean;
  cookies: {
    get: (key: string) => string | undefined;
    set: RequestContextExtensions["setCookie"];
    destroy: RequestContextExtensions["deleteCookie"];
    outgoingCookies: RequestContextExtensions["outgoingCookies"];
  };
  assets: string[];
  render: {
    // this needs to move to an API store, its not callable from rsc
    treeToStaticHtml: (tree: ReactNode) => Promise<string>;
    // htmlStream: (tree: ReactNode) => Promise<ReadableStream<Uint8Array>>;
    // rscStream: (tree: ReactNode) => Promise<ReadableStream<Uint8Array>>;
  };
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
