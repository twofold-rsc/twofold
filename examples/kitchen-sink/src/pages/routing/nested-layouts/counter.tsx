"use client";

import { useState } from "react";

export default function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div className="border border-dashed border-purple-500 p-4">
      <h3 className="text-sm text-purple-500">Client component</h3>
      <div className="mt-2 flex items-center space-x-4 ">
        <span className="text-lg font-bold tabular-nums tracking-wide text-gray-700">
          {count}
        </span>
        <button
          onClick={() => {
            setCount((c) => c + 1);
          }}
          className="block rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-medium hover:border-gray-200 hover:bg-gray-100"
        >
          Add 1
        </button>
      </div>
    </div>
  );
}
