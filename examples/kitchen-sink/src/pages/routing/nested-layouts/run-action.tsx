"use client";

import { useState } from "react";

export default function RunAction({
  action,
}: {
  action: () => Promise<string>;
}) {
  let [result, setResult] = useState<string>();

  async function formAction() {
    let actionResult = await action();
    setResult(actionResult);
  }
  return (
    <div className="border border-dashed border-purple-500 p-4">
      <h3 className="text-sm text-purple-500">Server action</h3>
      <div className="mt-2">
        <div className="text-xs">{result ? result : "No result yet"}</div>
        <form action={formAction} className="mt-2">
          <button
            type="submit"
            className="block rounded border border-gray-100 bg-gray-50 px-4 py-1.5 text-sm font-medium hover:border-gray-200 hover:bg-gray-100"
          >
            Run action
          </button>
        </form>
      </div>
    </div>
  );
}
