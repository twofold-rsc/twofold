"use client";

import { useState } from "react";

export default function ClientComponent() {
  let [count, setCount] = useState(0);

  return (
    <div>
      <p className="inline-block bg-sky-500 px-4 py-1 text-sm font-semibold text-white">
        Counter
      </p>
      <div className="border-2 border-dashed border-sky-500 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setCount((c) => c + 1);
            }}
            className="inline-flex rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-medium shadow hover:border-gray-200 hover:bg-gray-100"
          >
            Add 1
          </button>
          <span className="text-lg font-bold tabular-nums tracking-wide text-gray-700">
            {count}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Uppercase() {
  let [text, setText] = useState("");

  return (
    <div>
      <p className="inline-block bg-violet-500 px-4 py-1 text-sm font-semibold text-white">
        Text to Uppercase
      </p>
      <div className="border-2 border-dashed border-violet-500 p-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Enter text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm shadow"
          />
          <p className="text-lg font-bold text-gray-700">
            {text.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
