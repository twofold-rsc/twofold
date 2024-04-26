"use client";

import { useActionState } from "react";

type FormState = {
  email: string;
  password: string;
  errors: string[];
};

export function LoginForm({
  action,
}: {
  action: (formData: FormData) => Promise<FormState>;
}) {
  let [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (state, formData) => {
      let formEntries = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      };

      try {
        let response = await action(formData);
        return {
          ...formEntries,
          errors: response.errors,
        };
      } catch (e: unknown) {
        return {
          ...formEntries,
          errors: ["An unknown error occurred"],
        };
      }
    },
    {
      errors: [],
      email: "email@example.com",
      password: "password",
    },
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
            defaultValue={state.email}
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
            defaultValue={state.password}
            required
            placeholder="Password"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 shadow"
          />
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-3 py-1.5 font-medium text-white shadow disabled:bg-black/60"
          >
            Login
          </button>
        </div>
      </div>
    </form>
  );
}
