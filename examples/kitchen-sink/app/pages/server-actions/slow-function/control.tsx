"use client";

import { action } from "./action";
import { useActionState } from "react";

export default function Control() {
  let [state, formAction, isPending] = useActionState(action, null);

  return (
    <div>
      <p>Result: {state}</p>

      <form action={formAction} className="mt-4">
        <button
          type="submit"
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow disabled:bg-black/60"
          disabled={isPending}
        >
          Run slow action
        </button>
      </form>
    </div>
  );
}
