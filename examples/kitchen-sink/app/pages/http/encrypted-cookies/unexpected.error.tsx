"use client";

import { ErrorProps } from "@twofold/framework/types";

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div>
      <p>You should get an error when trying to stringify a function.</p>
      <p className="pt-3">Error: {error.message}</p>
      <div className="pt-5">
        <button onClick={reset} className="text-blue-500">
          Reset
        </button>
      </div>
    </div>
  );
}
