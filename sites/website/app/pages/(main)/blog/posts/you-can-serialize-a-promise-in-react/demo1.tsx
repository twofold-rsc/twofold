"use client";

import { useActionState, JSX, ReactNode } from "react";
import { getDemo1 } from "./demo1-action";

export function Demo1({ children }: { children: ReactNode }) {
  const [jsx, action] = useActionState(
    (prev: JSX.Element | null, action: "run" | "reset") => {
      if (action === "run") {
        return getDemo1();
      } else if (action === "reset") {
        return null;
      } else {
        return prev;
      }
    },
    null,
  );

  return (
    <div className="not-prose relative">
      <div>{children}</div>
      <div className="relative -mx-2 flex min-h-[158px] items-center justify-center rounded-b-md border-x-2 border-b-2 border-gray-200 sm:mx-0">
        {jsx ? (
          <div>
            <div className="flex items-center justify-center px-8">{jsx}</div>

            <form
              className="absolute top-1.5 right-3"
              action={() => action("reset")}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 transition-colors hover:text-blue-500 hover:underline"
              >
                Reset
              </button>
            </form>
          </div>
        ) : (
          <form action={() => action("run")}>
            <button className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white">
              Try it out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
