"use client";

import { useState } from "react";

export default function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => {
          setCount((c) => c - 1);
        }}
        className="inline-flex rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-bold shadow hover:border-gray-200 hover:bg-gray-100"
      >
        -
      </button>
      <span className="text-lg font-bold tabular-nums tracking-wide text-gray-700">
        {count}
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
  );
}
