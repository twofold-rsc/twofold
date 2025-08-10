"use client";

import { useActionState, JSX, ReactNode } from "react";
import { ReactIcon } from "../../../../../icons/react";
import Spinner from "../../../../../components/spinner";

function Result() {
  return (
    <div>
      <div className="flex items-center space-x-1.5 text-sky-500">
        <ReactIcon className="size-5" />
        <div className="text-sm font-medium">https://react.dev</div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="font-mono text-sm font-medium text-gray-500">
          Page title
        </p>
        <p className="text-lg text-gray-900">React</p>
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-mono text-sm font-medium text-gray-500">
          Page description
        </p>
        <p className="line-clamp-3 text-base text-gray-900">
          React is the library for web and native user interfaces. Build user
          interfaces out of individual pieces called components written in
          JavaScript. React is designed to let you seamlessly combine components
          written by independent people, teams, and organizations.
        </p>
      </div>
    </div>
  );
}

export function Demo1({ children }: { children: ReactNode }) {
  let [jsx, action, isPending] = useActionState(
    async (prev: JSX.Element | null, action: "run" | "reset") => {
      if (action === "run") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return <Result />;
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
      <div className="relative -mx-2 flex min-h-[264px] items-center justify-center rounded-b-md border-x-2 border-b-2 border-gray-200 sm:mx-0">
        {isPending ? (
          <div className="flex items-center justify-center space-x-1.5">
            <Spinner className="size-4" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : jsx ? (
          <div>
            <div className="flex items-center justify-center px-8 py-8 sm:px-16">
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
              Fetch react.dev
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
