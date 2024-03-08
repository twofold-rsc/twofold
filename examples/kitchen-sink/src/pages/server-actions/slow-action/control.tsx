"use client";

import { useFormState, useFormStatus } from "react-dom";
import { action } from "./action";

export default function Control() {
  let [state, formAction] = useFormState(action, null);

  return (
    <div>
      <p>Result: {state}</p>

      <form action={formAction} className="mt-4">
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  let { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow disabled:bg-black/60"
      disabled={pending}
    >
      Run slow action
    </button>
  );
}
