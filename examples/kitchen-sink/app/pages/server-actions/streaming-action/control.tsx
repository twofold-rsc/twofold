"use client";

import { action } from "./action";
import { FormEvent, startTransition, useState } from "react";

export default function Control() {
  let [isStreaming, setIsStreaming] = useState(false);
  let [chunks, setChunks] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setIsStreaming(true);

    setChunks([]);
    let stream = await action();
    let reader = stream.getReader();
    while (true) {
      let { done, value } = await reader.read();
      if (done) {
        break;
      }
      setChunks((chunks) => [...chunks, value]);
    }

    setIsStreaming(false);
  }

  return (
    <div>
      <p>Result: {chunks.join(", ")}</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <button
          type="submit"
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow disabled:bg-black/60"
          disabled={isStreaming}
        >
          Run stream
        </button>
      </form>
    </div>
  );
}
