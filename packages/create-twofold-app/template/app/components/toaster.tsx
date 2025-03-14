"use client";

import { useFlash } from "@twofold/framework/flash";
import z from "zod";

export function Toaster() {
  let { messages } = useFlash({
    schema: z.string(),
    clearAfter: 3000,
  });

  let latestMessage = messages.at(-1);
  if (!latestMessage) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4">
      <div className="w-64 rounded bg-white p-4 text-sm shadow ring ring-gray-200 ring-inset">
        <div className="truncate">{latestMessage}</div>
      </div>
    </div>
  );
}
