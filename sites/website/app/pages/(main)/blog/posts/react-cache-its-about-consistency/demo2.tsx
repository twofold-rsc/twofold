"use client";

import {
  useActionState,
  JSX,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { ReactIcon } from "../../../../../icons/react";
import Spinner from "../../../../../components/spinner";
import clsx from "clsx";

function Result() {
  return (
    <div>
      <div className="flex items-center space-x-1.5">
        <ReactIcon className="size-5" />
        <div className="text-sm font-medium text-sky-500">
          https://react.dev
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <p className="font-mono text-sm font-medium text-gray-500">
          Page title
        </p>
        <p className="text-lg font-medium text-gray-900">The old React title</p>
      </div>

      <Description />
    </div>
  );
}

function Description() {
  let [isPending, setIsPending] = useState(true);

  useTimeout(() => {
    setIsPending(false);
  }, 3200);

  return (
    <div className="mt-3 space-y-1">
      <p className="font-mono text-sm font-medium text-gray-500">
        Page description
      </p>

      {isPending ? (
        <div className="mt-1.5 flex items-center space-x-1.5">
          <Spinner className="size-4" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      ) : (
        <p className="text-base text-gray-900">
          The new description of react.dev! Do you see the new title as well? Or
          is it inconsistent?
        </p>
      )}
    </div>
  );
}

function useTimeout(callback: () => void, delay: number) {
  let callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setTimeout(callbackRef.current, delay);
    return () => clearTimeout(id);
  }, [delay]);
}

export function Demo2() {
  let [jsx, action] = useActionState(
    (prev: JSX.Element | null, action: "run" | "reset") => {
      if (action === "run") {
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
      <div
        className={clsx(
          "relative -mx-2 flex min-h-[264px] rounded-md border-2 border-gray-200 sm:mx-0 sm:min-h-[240px]",
          !jsx && "items-center justify-center",
          jsx && "items-start justify-start",
        )}
      >
        {jsx ? (
          <>
            <div className="h-full w-full px-8 py-8 sm:px-16">{jsx}</div>

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
          </>
        ) : (
          <form action={() => action("run")}>
            <button className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white">
              Inconsistent fetch
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
