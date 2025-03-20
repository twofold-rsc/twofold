"use client";

import { useActionState } from "react";

export type State = {
  name: string;
  success: boolean;
  error: string | null;
};

export function FormWithClientState({
  action,
}: {
  action: (prev: State, payload: FormData) => Promise<State>;
}) {
  let [state, formAction] = useActionState(action, {
    name: "",
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <div className="text-red-500">{state.error}</div> : null}
      {state.success ? <div className="text-green-500">Success!</div> : null}
      <div>
        <input
          type="text"
          defaultValue={state.name}
          name="name"
          className="rounded border border-gray-200 px-3 py-1 shadow"
          required
        />
      </div>
      <div className="mt-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
