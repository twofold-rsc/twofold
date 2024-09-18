"use client";

import { useState } from "react";

export function APIForm() {
  let [json, setJSON] = useState();

  async function sendToAPI(formData: FormData) {
    let response = await fetch("/http/api/basic", {
      method: "post",
      body: formData,
    });

    let json = await response.json();

    setJSON(json);
  }

  return (
    <div>
      <div>{json && <pre>{JSON.stringify(json, null, 2)}</pre>}</div>
      <form action={sendToAPI} className="mt-4">
        <div>
          <input
            type="text"
            name="name"
            className="rounded border border-gray-300 px-3 py-1.5"
            placeholder="Name"
          />
        </div>
        <div className="mt-3 flex items-center space-x-2">
          <button
            type="button"
            className="rounded bg-gray-100 px-4 py-2 text-black"
            onClick={() => setJSON(undefined)}
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
