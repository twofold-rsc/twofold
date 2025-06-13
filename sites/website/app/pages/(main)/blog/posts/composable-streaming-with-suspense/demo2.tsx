"use client";

import clsx from "clsx";
import { Browser } from "../../components/browser";
import * as Switch from "@radix-ui/react-switch";

export function Demo2() {
  return (
    <div className="not-prose">
      <div className="-mx-8">
        <Browser
          url="https://twofoldframework.com/blog"
          onRefresh={() => console.log("Refresh clicked")}
        >
          <div className="flex h-full grow flex-col items-center justify-center px-4 py-3.5">
            <EmptyState />
          </div>
        </Browser>
      </div>
      <div className="mt-4 text-center"></div>
    </div>
  );
}

function EmptyState() {
  return (
    <form className="space-y-5">
      <h3 className="text-lg leading-none font-medium tracking-tight text-gray-900">
        Blog post demo
      </h3>
      <div className="flex items-center space-x-2">
        <Switch.Root
          defaultChecked
          id="demo-2-stream-comments"
          className={clsx(
            "h-full w-7 rounded-full p-0.5",
            "data-[state=unchecked]:bg-gray-200",
            "data-[state=checked]:bg-blue-200",
          )}
        >
          <Switch.Thumb
            className={clsx(
              "block size-3 rounded-full transition-all",
              "data-[state=unchecked]:bg-gray-400",
              "data-[state=checked]:translate-x-3 data-[state=checked]:bg-blue-500",
            )}
          />
        </Switch.Root>
        <label htmlFor="demo-2-stream-comments" className="text-sm select-none">
          Lazily stream comments with Suspense
        </label>
      </div>
      <div>
        <button
          type="submit"
          formAction={() => {}}
          className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow-lg"
        >
          Load the blog
        </button>
      </div>
    </form>
  );
}
