"use client";

import {
  ReactNode,
  createContext,
  startTransition,
  useEffect,
  useState,
} from "react";

type Callback = () => void | Promise<void>;

export let ViewTransitionsContext = createContext<(callback: Callback) => void>(
  () => {},
);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [resolver, setResolver] = useState<(() => void) | null>(null);

  function startViewTransition(callback: Callback) {
    if ("startViewTransition" in document) {
      // @ts-ignore
      document.startViewTransition(() => {
        return new Promise<void>((resolve) => {
          startTransition(async () => {
            setResolver(() => resolve);
            let result = callback();
            if (result && "then" in result) {
              await result;
            }
          });
        });
      });
    } else {
      callback();
    }
  }

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
