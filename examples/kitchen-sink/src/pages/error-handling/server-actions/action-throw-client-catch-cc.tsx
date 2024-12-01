"use client";

import { useState } from "react";

export default function ActionThrowClientCatchCC({
  action,
}: {
  action: () => Promise<void>;
}) {
  let [didCatch, setDidCatch] = useState(false);

  let clientSideAction = async () => {
    try {
      await action();
    } catch (e) {
      console.log("caught error", e);
      setDidCatch(true);
    }
  };

  return (
    <form action={clientSideAction} className="space-y-2">
      {didCatch && <p className="text-sm text-red-500">Caught an error...</p>}
      <div>
        <button type="submit" className="bg-black px-2.5 py-1 text-white">
          Fire action
        </button>
      </div>
    </form>
  );
}
