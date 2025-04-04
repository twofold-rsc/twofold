import { AsyncLocalStorage } from "node:async_hooks";
import { ReactNode } from "react";
import { SerializeOptions } from "cookie";

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type Store = {
  reqId: number;
  build: "development" | "production";
  canReload: boolean;
  cookies: {
    all: () => Record<string, string | undefined>;
    get: (key: string) => string | undefined;
    set(key: string, value: string, options?: SerializeOptions): void;
    destroy(key: string, options?: SerializeOptions): void;
    outgoingCookies(): {
      name: string;
      value: string;
      options?: SerializeOptions;
    }[];
  };
  encryption: {
    encrypt(value: any): Promise<string>;
    decrypt(value: string): Promise<any>;
  };
  flash: {
    add(message: JSONValue): void;
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
