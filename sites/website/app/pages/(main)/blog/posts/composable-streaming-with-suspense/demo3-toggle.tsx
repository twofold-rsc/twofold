"use client";

import { createContext, ReactNode, use, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";

let Context = createContext<{
  isShowingSuspense: boolean;
  toggleSuspense: () => void;
}>({
  isShowingSuspense: true,
  toggleSuspense: () => {},
});

export function ToggleRoot({ children }: { children: ReactNode }) {
  let [isShowingSuspense, setIsShowingSuspense] = useState(true);

  return (
    <Context
      value={{
        isShowingSuspense,
        toggleSuspense: () => setIsShowingSuspense((c) => !c),
      }}
    >
      <Tabs.Root
        value={isShowingSuspense ? "streaming" : "not-streaming"}
        className="w-full"
      >
        {children}
      </Tabs.Root>
    </Context>
  );
}

export function ToggleContent({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return <Tabs.Content value={id}>{children}</Tabs.Content>;
}

export function ToggleSwitch() {
  let { isShowingSuspense, toggleSuspense } = use(Context);

  return (
    <form className="-mt-2 flex items-center justify-center space-x-2">
      <Switch.Root
        checked={isShowingSuspense}
        onCheckedChange={toggleSuspense}
        id="demo-3-stream-comments"
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

      <label htmlFor="demo-3-stream-comments" className="text-sm select-none">
        Stream comments with Suspense
      </label>
    </form>
  );
}
