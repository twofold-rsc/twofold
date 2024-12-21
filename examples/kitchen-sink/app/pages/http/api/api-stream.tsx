"use client";

import { useState } from "react";

export function APIStream() {
  let [text, setText] = useState("");

  async function streamAPI() {
    let response = await fetch("/http/api/streaming");
    let decoder = new TextDecoder();

    if (response.body) {
      let reader = response.body.getReader();
      let done = false;
      while (!done) {
        let { value, done: _done } = await reader.read();
        done = _done;
        if (value) {
          let text = decoder.decode(value, { stream: true });
          setText((t) => `${t}${text}`);
        }
      }
    }
  }

  return (
    <div>
      <div>{text && <pre>{text}</pre>}</div>
      <div className="mt-3 flex items-center space-x-2">
        <button
          onClick={() => setText("")}
          className="rounded bg-gray-100 px-4 py-2 text-black"
        >
          Clear
        </button>
        <button
          onClick={streamAPI}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          Stream
        </button>
      </div>
    </div>
  );
}
