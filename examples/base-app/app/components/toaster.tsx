"use client";

import { useFlash } from "@twofold/framework/flash";
import * as z from "zod";

/**
 * This component displays a toast notification when you call `flash()`
 * in an action.
 *
 * For more information, see the Flash documentation:
 * https://twofoldframework.com/docs/reference/flash-messages
 */
export function Toaster() {
  let { messages } = useFlash({
    schema: z.string(),
    clearAfter: 2000,
  });

  let latestMessage = messages.at(-1);
  if (!latestMessage) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4">
      <div className="w-64 rounded bg-white p-4 text-sm shadow ring ring-gray-950/10">
        <div className="truncate">{latestMessage}</div>
      </div>
    </div>
  );
}
