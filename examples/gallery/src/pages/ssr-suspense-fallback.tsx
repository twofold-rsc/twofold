"use client";

import { ReactNode, Suspense, useSyncExternalStore } from "react";

let getSnapshot = () => false;
let getServerSnapshot = () => true;
let subscribe = () => () => {};

export function SSRSuspenseFallback({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  let forceFallback = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return forceFallback ? (
    fallback
  ) : (
    <Suspense unstable_expectedLoadTime={1000} fallback={fallback}>
      {children}
    </Suspense>
  );
}
