"use client";

import { useActionState } from "react";

export function FormWithServerState({
  initialState,
  increment,
}: {
  initialState: { count: number };
  increment: () => Promise<{ count: number }>;
}) {
  let [state, action] = useActionState(increment, initialState);

  return (
    <form action={action} className="space-y-3">
      <p>
        Count: <span data-testid="count">{state.count}</span>
      </p>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Increment
      </button>
    </form>
  );
}
