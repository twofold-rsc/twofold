"use client";

import { useFormState, useFormStatus } from "react-dom";

type FormState = {
  errors: string[];
};

export function LoginForm({
  action,
}: {
  action: (formData: FormData) => Promise<FormState>;
}) {
  //@ts-ignore
  let [state, formAction] = useFormState<FormState, FormData>(
    async (state, formData) => {
      try {
        let response = await action(formData);
        return response;
      } catch (e: unknown) {
        return { errors: ["An unknown error occurred"] };
      }
    },
    { errors: [] },
  );

  return (
    <form action={formAction}>
      {state.errors.length > 0 && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-red-500 shadow">
          <ul>
            {state.errors.map((error, index) => (
              <li key={index} className="text-red-600">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="max-w-[320px]">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-500">
            Email address
          </label>
          <input
            type="email"
            name="email"
            defaultValue="email@example.com"
            placeholder="Email"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 shadow"
            required
          />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="block text-sm text-gray-500">
            Password
          </label>
          <input
            type="password"
            name="password"
            defaultValue="password"
            required
            placeholder="Password"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 shadow"
          />
        </div>
        <div className="mt-4">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}

function SubmitButton() {
  let status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="rounded bg-black px-3 py-1.5 font-medium text-white shadow disabled:bg-black/60"
    >
      Login
    </button>
  );
}
