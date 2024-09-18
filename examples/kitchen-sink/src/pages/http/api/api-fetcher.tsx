"use client";

import { useState } from "react";

export function APIFetcher({ path }: { path: string }) {
  let [json, setJSON] = useState();

  async function fetchData() {
    let response = await fetch(path);
    let json = await response.json();
    setJSON(json);
  }

  function clearData() {
    setJSON(undefined);
  }

  return (
    <div>
      <div>{json && <pre>{JSON.stringify(json, null, 2)}</pre>}</div>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={clearData}
          className="rounded bg-gray-100 px-4 py-2 text-black"
        >
          Clear data
        </button>
        <button
          onClick={fetchData}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          Fetch data
        </button>
      </div>
    </div>
  );
}
