"use client";

import { useTransition } from "react";
import { incrementCount } from "./actions";
import clsx from "clsx";

export function IncrementCountButton({ count }: { count: number }) {
  let [isPending, startTransition] = useTransition();

  async function handleClick() {
    startTransition(async () => {
      await incrementCount();
    });
  }

  return (
    <div>
      <p className="text-gray-500">Current count {count}</p>
      <div className="mt-4">
        <button
          onClick={handleClick}
          className={clsx(
            "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white",
            isPending ? "bg-black/60" : "bg-black hover:bg-gray-800",
          )}
        >
          Increment count
        </button>
      </div>
    </div>
  );
}
