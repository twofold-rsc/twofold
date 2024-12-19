"use client";

import { useRouter } from "@twofold/framework/use-router";

export default function RouterInfo() {
  let router = useRouter();

  return (
    <div>
      <div>
        Path:{" "}
        <span className="font-mono text-sm text-gray-900">{router.path}</span>
      </div>
      <div className="mt-3">
        <button
          onClick={() => {
            router.refresh();
          }}
          className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
