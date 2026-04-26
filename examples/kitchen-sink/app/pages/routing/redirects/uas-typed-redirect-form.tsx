"use client";

import { useActionState } from "react";
import { action } from "./uas-typed-action";

const initialState = {
  value: "test",
};

export function UASTypedRedirectForm() {
  const [state, formAction, isPending] = useActionState(
    () => action(true),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <p>State: {state.value}</p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-1.5 font-medium text-white disabled:opacity-50"
        >
          Run action
        </button>
      </div>
    </form>
  );
}
