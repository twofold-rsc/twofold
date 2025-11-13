"use client";

import { useFlash } from "@twofold/framework/flash";
import * as z from "zod";

export function ObjectFlash({ action }: { action: () => void }) {
  let { messages } = useFlash({
    schema: z.object({
      type: z.literal("object"),
      text: z.string(),
    }),
    clearAfter: 5000,
  });

  return (
    <div>
      <form action={action}>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
        >
          Object flash
        </button>
      </form>
      <ul className="mt-3 ml-4 list-disc">
        {messages.map((message, i) => (
          <li key={i}>{message.text}</li>
        ))}
      </ul>
    </div>
  );
}
