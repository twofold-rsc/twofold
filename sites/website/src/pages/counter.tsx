"use client";

import { useState } from "react";

export default function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div>
      <p className="text-gray-500 text-xl text-center">Count</p>
      <p className="tabular-nums text-5xl text-gray-950 font-bold text-center">
        {count}
      </p>

      <div className="flex space-x-2 items-center mt-4">
        <button
          onClick={() => setCount(count - 1)}
          className="rounded shadow px-3 py-1.5 font-medium text-white bg-gray-950 w-1/2"
        >
          Decrement
        </button>

        <button
          onClick={() => setCount(count + 1)}
          className="rounded shadow px-3 py-1.5 font-medium text-white bg-gray-950 w-1/2"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
