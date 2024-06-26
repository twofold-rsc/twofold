"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";

type Success = {
  type: "success";
};

type Error = {
  type: "error";
  errors: string[];
};

export default function FormWithState({
  action,
}: {
  action: (form: FormData) => Promise<Success | Error>;
}) {
  let [state, formAction, isPending] = useActionState<
    Success | Error | null,
    FormData
  >(async (state, payload) => {
    let result = await action(payload);
    return result;
  }, null);

  return (
    <form action={formAction}>
      {isPending ? (
        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <FormStatus />
        </div>
      ) : !state ? (
        <div className="border-l-4 border-gray-500 bg-gray-50 p-4">
          You have not yet submitted the form
        </div>
      ) : state.type === "error" ? (
        <div className="border-l-4 border-red-500 bg-red-50 p-4">
          {state.errors.join(", ")}
        </div>
      ) : (
        <div className="border-l-4 border-green-500 bg-green-50 p-4">
          Success!
        </div>
      )}

      <div className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          name="name"
          autoComplete="off"
          placeholder="Enter a name"
          className="rounded border border-gray-300 px-2 py-1.5 shadow"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-1.5 font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function FormStatus() {
  let status = useFormStatus();

  return <>Form submitting with "{status.data?.get("name") as string}"</>;
}
