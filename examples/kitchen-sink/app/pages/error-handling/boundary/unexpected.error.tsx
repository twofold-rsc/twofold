"use client";

import { useRouter } from "@twofold/framework/use-router";
import { startTransition } from "react";

export default function ErrorUI({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  let { navigate } = useRouter();

  function goBack() {
    startTransition(() => {
      reset();
      navigate("/error-handling/boundary");
    });
  }

  return (
    <div className="mx-auto max-w-[65ch] rounded border border-red-500 bg-red-50 p-6">
      <h1 className="text-3xl font-extrabold tracking-tighter text-red-500">
        Something went wrong
      </h1>
      <div className="border-gray-3000 mt-4 rounded border bg-gray-50 p-2">
        <p className="font-mono text-sm text-black">
          process.env.NODE_ENV ={" "}
          <span className="font-semibold">{process.env.NODE_ENV}</span>
        </p>
      </div>
      <div>
        <p className="mt-4 text-sm font-semibold text-gray-600">Error</p>
        <p className="mt-1">{error.message}</p>
      </div>
      {error.stack && (
        <div>
          <p className="mt-4 text-sm font-semibold text-gray-600">
            Stack trace
          </p>
          <div>
            {error.stack.split("\n").map((line, i) => (
              <div className="mt-1 font-mono text-xs" key={i}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
      {error.digest && (
        <div>
          <p className="mt-4 text-sm font-semibold text-gray-600">Digest</p>
          <p className="mt-1">{error.digest}</p>
        </div>
      )}
      <div className="mt-8">
        <button
          onClick={goBack}
          className="rounded bg-black px-3 py-1.5 font-semibold text-white shadow"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
