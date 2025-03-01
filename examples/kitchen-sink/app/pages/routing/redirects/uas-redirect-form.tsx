"use client";

import { useActionState } from "react";
import { serverFunction } from "./uas-redirect-actions";

type State = {
  times: number;
  value: string;
};

export function UASRedirectForm() {
  // if the server function redirects, then it returns nothing. in that
  // case the rest of this code shouldn't run. we expect the server to
  // return a thrown error.
  let [state, dispatch, isPending] = useActionState<State, FormData>(
    async (prev, payload) => {
      let shouldRedirect = prev.times === 2;
      let result = await serverFunction(shouldRedirect);

      return {
        value: result.randomString.toUpperCase(),
        times: prev.times + 1,
      };
    },
    {
      times: 0,
      value: "initial",
    },
  );

  async function action(formData: FormData) {
    dispatch(formData);
  }

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <p>State: {state.value}</p>
        <p>Times run: {state.times}</p>
        <p>Next action will redirect: {state.times >= 2 ? "Yes" : "No"}</p>
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
