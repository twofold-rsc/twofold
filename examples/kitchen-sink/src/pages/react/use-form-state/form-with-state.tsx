"use client";

import { useFormState, useFormStatus } from "react-dom";

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
  let [state, formAction] = useFormState(
    async (state: Success | Error | null, payload: FormData) => {
      let result = await action(payload);
      return result;
    },
    null
  );

  return (
    <form action={formAction}>
      <FormInner state={state} />
    </form>
  );
}

// Need inner component so we can useFormStatus
function FormInner({ state }: { state: Success | Error | null }) {
  let status = useFormStatus();

  return (
    <>
      {status.pending ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          Form submitting with "{status.data.get("name") as string}"
        </div>
      ) : !state ? (
        <div className="bg-gray-50 border-l-4 border-gray-500 p-4">
          You have not yet submitted the form
        </div>
      ) : state.type === "error" ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          {state.errors.join(", ")}
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          Success!
        </div>
      )}

      <div className="flex space-x-2 items-center mt-3">
        <input
          type="text"
          name="name"
          autoComplete="off"
          placeholder="Enter a name"
          className="border border-gray-300 px-2 py-1.5 shadow rounded"
        />
        <button
          type="submit"
          disabled={status.pending}
          className="px-4 py-1.5 bg-black text-white font-medium rounded disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </>
  );
}
