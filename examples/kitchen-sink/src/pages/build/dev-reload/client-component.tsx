"use client";

import { useState } from "react";

export default function ClientComponent() {
  let [count, setCount] = useState(0);
  return (
    <div>
      <div className="bg-sky-500 text-white inline-flex py-1 px-2 -mb-0.5 rounded-t">
        Client component
      </div>
      <div className="border-2 border-dashed border-sky-500 rounded p-4">
        <p className="text-gray-900">
          This section is a client component and editing it causes only the
          client module to reload.
        </p>
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={() => {
              setCount((c) => c - 1);
            }}
            className="rounded shadow bg-gray-50 hover:bg-gray-100 font-bold text-sm inline-flex py-1.5 px-4 border border-gray-100 hover:border-gray-200"
          >
            -
          </button>
          <span className="text-gray-700 text-lg font-bold tracking-wide tabular-nums">
            {count === 6 ? "SIX" : count}
          </span>
          <button
            onClick={() => {
              setCount((c) => c + 1);
            }}
            className="rounded shadow bg-gray-50 hover:bg-gray-100 font-bold text-sm inline-flex py-1.5 px-4 border border-gray-100 hover:border-gray-200"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
