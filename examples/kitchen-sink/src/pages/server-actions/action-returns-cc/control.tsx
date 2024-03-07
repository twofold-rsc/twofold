"use client";

import { ReactNode, useState, useTransition } from "react";
import action from "./action-file";

export default function Control() {
  let [component, setComponent] = useState<ReactNode>();
  let [isPending, startTransition] = useTransition();

  async function runAction() {
    startTransition(async () => {
      let c = await action();
      console.log({ c });
      setComponent(c);
    });
  }

  return (
    <div>
      <form action={runAction}>
        <button
          type="submit"
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Run action
        </button>
      </form>

      <div className="mt-3 border-2 border-dashed border-gray-300 p-8">
        {isPending
          ? "Component is loading..."
          : component
            ? component
            : "Run the action to see the component"}
      </div>
    </div>
  );
}
