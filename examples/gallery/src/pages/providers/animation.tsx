"use client";

import { useRouter } from "@twofold/framework/use-router";
import {
  ReactNode,
  createContext,
  startTransition,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type Callback = () => void | Promise<void>;

export let ViewTransitionsContext = createContext<
  (type: string, callback: Callback) => void
>(() => {});

let storePath: string | undefined;
let listeners: (() => void)[] = [];
let getSnapshot = () => storePath;
let subscribe = (listener: () => void) => {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

function change(newPath: string) {
  storePath = newPath;
  // do we need to reject the current view transition?
  emitChange();
}

function clear() {
  storePath = undefined;
  emitChange();
}

function emitChange() {
  for (let listener of listeners) {
    listener();
  }
}

export function useViewTransition() {
  let pendingPath = useSyncExternalStore(subscribe, getSnapshot);

  return {
    pendingPath,
    navigate: change,
  };
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [resolver, setResolver] = useState<(() => void) | null>(null);

  let { pendingPath } = useViewTransition();
  let { navigate, path } = useRouter();

  let startViewTransition = useCallback((type: string, callback: Callback) => {
    if ("startViewTransition" in document) {
      // @ts-ignore
      document.startViewTransition({
        types: [type],
        update: () => {
          return new Promise<void>((resolve) => {
            startTransition(async () => {
              setResolver(() => resolve);
              let result = callback();
              if (result && "then" in result) {
                await result;
              }
            });
          });
        },
      });
    } else {
      callback();
    }
  }, []);

  useEffect(() => {
    if (pendingPath && pendingPath !== path) {
      startViewTransition("open-gallery", () => {
        if (pendingPath && pendingPath !== path) {
          console.log("navigating to", pendingPath);
          navigate(pendingPath);
        }
      });
    }
  }, [startViewTransition, path, navigate, pendingPath]);

  useEffect(() => {
    if (path === pendingPath) {
      clear();
    }
  }, [path, pendingPath]);

  useEffect(() => {
    if (resolver) {
      resolver();
      setResolver(null);
    }
  }, [resolver]);

  return (
    <ViewTransitionsContext.Provider value={startViewTransition}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}
