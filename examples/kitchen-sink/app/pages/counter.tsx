"use client";

import { useState } from "react";

export default function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div>
      <p className="text-center text-xl text-gray-500">Count</p>
      <p className="text-center text-5xl font-bold text-gray-950 tabular-nums">
        {count}
      </p>

      <div className="mt-4 flex items-center space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="w-1/2 rounded bg-gray-950 px-3 py-1.5 font-medium text-white shadow"
        >
          Decrement
        </button>

        <button
          onClick={() => setCount(count + 1)}
          className="w-1/2 rounded bg-gray-950 px-3 py-1.5 font-medium text-white shadow"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
