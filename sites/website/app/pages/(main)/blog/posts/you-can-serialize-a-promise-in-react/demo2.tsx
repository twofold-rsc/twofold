"use client";

import { ReactNode, useActionState } from "react";
import { addStream, useStream } from "./stream-store";
import clsx from "clsx";

export function Demo2({ children }: { children: ReactNode }) {
  const [id, action] = useActionState(
    (prev: string | null, action: "run" | "reset") => {
      if (action === "run") {
        const stream = new ReadableStream({
          async start(controller) {
            await new Promise((resolve) => setTimeout(resolve, 1_000));

            const promise = new Promise((resolve) => {
              setTimeout(() => resolve("Hello!"), 1_500);
            });

            controller.enqueue("promise:create\n");

            const value = await promise;
            controller.enqueue(`promise:resolve:${value}\n`);
            controller.close();
          },
        });

        const id = addStream(stream);
        return id;
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
      <div
        className={clsx(
          "relative -mx-2 flex min-h-[158px] rounded-b-md border-x-2 border-b-2 border-gray-200 sm:mx-0",
          id ? "" : "items-center justify-center",
        )}
      >
        {id ? (
          <div className="h-full w-full">
            <ReadStream id={id} />

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

function ReadStream({ id }: { id: string }) {
  const { content, state } = useStream(id);
  const lines = content?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="h-full w-full space-y-1 px-8 py-8 text-sm font-medium">
      <p className="font-mono text-gray-500">*** Reading stream...</p>
      {lines.map((line, i) => (
        <p key={i} className="block overflow-x-scroll font-mono">
          <span className="text-gray-900">*** </span>{" "}
          <span className="text-blue-500">{line}</span>
        </p>
      ))}
      <p className="font-mono text-gray-500">
        {state === "complete" && "*** Complete!"}
      </p>
    </div>
  );
}
