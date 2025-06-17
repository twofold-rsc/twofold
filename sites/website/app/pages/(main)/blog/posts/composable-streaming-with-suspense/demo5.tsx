"use client";

import { JSX, ReactNode, useActionState } from "react";
import { getDemo5 } from "./demo5-action";
import { DemoContent } from "../../components/demo";

export function Demo5({ children }: { children: ReactNode }) {
  const [jsx, action] = useActionState(
    (prev: JSX.Element | null, action: "run" | "reset") => {
      if (action === "run") {
        return getDemo5();
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
      <DemoContent className="min-h-[212px]">
        {jsx ? (
          <div className="w-full sm:px-8">
            <div className="flex flex-grow items-center justify-center">
              {jsx}
            </div>

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
              Lazily load models
            </button>
          </form>
        )}
      </DemoContent>
    </div>
  );
}
