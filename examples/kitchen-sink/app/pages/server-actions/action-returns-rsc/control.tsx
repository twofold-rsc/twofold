"use client";

import { ReactNode, useActionState } from "react";
import { getBlueComponent, getTimeComponent } from "./action-file";

export function Control() {
  let [component, dispatch, isPending] = useActionState(
    (prev: ReactNode, action: string) => {
      if (action === "rsc") {
        return getTimeComponent();
      } else if (action === "rsc-with-children") {
        return getBlueComponent(<p>This component should be blue</p>);
      }

      return null;
    },
    null,
  );

  return (
    <div>
      <form className="flex items-center space-x-3">
        <button
          type="submit"
          formAction={() => dispatch("rsc")}
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Get RSC
        </button>
        <button
          type="submit"
          formAction={() => dispatch("rsc-with-children")}
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Get RSC with children
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
