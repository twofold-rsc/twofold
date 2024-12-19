"use client";

import { useRouter } from "@twofold/framework/use-router";

export function RefreshButton() {
  let { refresh } = useRouter();
  return (
    <button
      className="rounded bg-black px-3 py-1 font-medium text-white"
      onClick={refresh}
    >
      Refresh
    </button>
  );
}
