"use client";

import { ReactNode, Suspense, use, useActionState, useState } from "react";
import {
  createFromReadableStream,
  // @ts-expect-error: TypeScript cannot find type declarations for this module
} from "react-server-dom-webpack/client.browser";

/*
0:"$@1"
1:"Hello from the server!"

0:{"promise":"$@1"}
1:"Hello from the server!"
*/

export function Demo5({ children }: { children: ReactNode }) {
  const [value, action, isPending] = useActionState(
    async (prev: Promise<string> | null, action: "run" | "reset") => {
      if (action === "run") {
        let encoder = new TextEncoder();
        let fakeRSCStream = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode('0:{"promise":"$@1"}\n'));

            await new Promise((resolve) => setTimeout(resolve, 1_500));

            controller.enqueue(encoder.encode('1:"Hello from the server!"\n'));
            controller.enqueue(encoder.encode("\n"));
            controller.close();
          },
        });

        let { promise } = await createFromReadableStream(fakeRSCStream);
        return promise;
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
      <div className="relative flex min-h-[158px] items-center justify-center rounded-b-md border-x-2 border-b-2 border-gray-200">
        {isPending && value === null ? (
          <div className="text-gray-500">
            Waiting for the promise to deserialize...
          </div>
        ) : value ? (
          <div>
            {value}

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
