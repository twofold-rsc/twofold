"use client";

import { useState } from "react";

export function Control() {
  let [state, setState] = useState<string>();

  async function handleClick() {
    const response = await fetch("/routing/pathless/api", {
      method: "POST",
    });
    let data = await response.text();
    setState(data);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Fetch API
      </button>
      <div className="mt-3">{state}</div>
    </div>
  );
}
