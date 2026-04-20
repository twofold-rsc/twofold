"use client";

import { useActionState } from "react";
import { action } from "./server-action";

export interface MyValue {
  value: string | undefined;
}

const initialState: MyValue = {
  value: "test",
};

export default function MyForm() {
  const [state, onSubmit, pending] = useActionState(
    () => action(true),
    initialState,
  );

  return (
    <form action={onSubmit}>
      {state.value ? <div>{state.value}</div> : null}
      <button type="submit" disabled={pending}>
        Send Request
      </button>
    </form>
  );
}
