"use client";

import { useState } from "react";

export default function ClientComponent() {
  let [count, setCount] = useState(0);
  return (
    <div>
      <div className="-mb-0.5 inline-flex rounded-t bg-sky-500 px-2 py-1 text-white">
        Client component
      </div>
      <div className="rounded border-2 border-dashed border-sky-500 p-4">
        <p className="text-gray-900">
          This section is a client component and editing it causes only the
          client module to reload.
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={() => {
              setCount((c) => c - 1);
            }}
            className="inline-flex rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-bold shadow hover:border-gray-200 hover:bg-gray-100"
          >
            -
          </button>
          <span className="text-lg font-bold tabular-nums tracking-wide text-gray-700">
            {count === 6 ? "SIX" : count}
          </span>
          <button
            onClick={() => {
              setCount((c) => c + 1);
            }}
            className="inline-flex rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-bold shadow hover:border-gray-200 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
