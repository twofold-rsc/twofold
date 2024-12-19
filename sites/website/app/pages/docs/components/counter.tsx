"use client";

import { useState } from "react";

export function Counter() {
  let [count, setCount] = useState(0);

  return (
    <div className="flex items-center space-x-2">
      <button
        className="bg-black text-white rounded font-medium px-2 py-1 text-sm"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <span>{count}</span>
    </div>
  );
}
