"use client";

import { useActionState, ReactNode } from "react";
import { reducer } from "./demo3-action";

export function Demo3() {
  let [result, action] = useActionState(reducer, null);

  return (
    <div className="not-prose relative">
      <div className="relative -mx-2 flex flex-col items-center justify-center space-y-8 rounded-md border-2 border-gray-200 py-8 sm:mx-0">
        <div>
          {result ? <p>{result}</p> : <p>Try out these impure functions</p>}
        </div>

        <form action={() => action("reset")}>
          <div className="flex w-full items-center justify-center gap-3">
            <button
              formAction={() => action("os.freemem")}
              className="inline-flex min-w-[105px] items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
            >
              os.freemem
            </button>

            <button
              formAction={() => action("new Date()")}
              className="inline-flex min-w-[105px] items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
            >
              new Date
            </button>

            <button
              formAction={() => action("/proc/uptime")}
              className="inline-flex min-w-[105px] items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
            >
              uptime
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
