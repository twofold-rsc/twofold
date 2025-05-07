"use client";

import { useActionState } from "react";
import { getRandomNumber } from "./actions";
import clsx from "clsx";

export function Random() {
  let [state, formAction, isPending] = useActionState(getRandomNumber, null);

  return (
    <form action={formAction}>
      {state ? (
        <p className="text-gray-500">Random number: {state}</p>
      ) : (
        <p className="text-gray-500">Generate a random number</p>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className={clsx(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white",
            isPending ? "bg-black/60" : "bg-black hover:bg-gray-800",
          )}
        >
          Random number
        </button>
      </div>
    </form>
  );
}
