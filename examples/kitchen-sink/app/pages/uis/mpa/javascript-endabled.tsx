"use client";

import { CheckBadgeIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { useSyncExternalStore } from "react";

function useJavaScriptEnabled() {
  const store = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return store;
}

export function JavaScriptEnabled() {
  const enabled = useJavaScriptEnabled();

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded px-3 py-1.5 text-lg text-white ${enabled ? "bg-green-500" : "bg-red-500"}`}
    >
      {enabled ? (
        <>
          <CheckBadgeIcon className="size-5" />
          <span>
            JavaScript is <span className="font-semibold">enabled</span>
          </span>
        </>
      ) : (
        <>
          <XCircleIcon className="size-5" />
          <span>
            JavaScript is <span className="font-semibold">disabled</span>
          </span>
        </>
      )}
    </div>
  );
}
