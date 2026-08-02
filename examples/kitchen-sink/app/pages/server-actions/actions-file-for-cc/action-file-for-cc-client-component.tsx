"use client";

import { action } from "./actions-file-for-cc";

export default function CCInvokesAction({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      <div>
        Count: <span data-testid="count">{count}</span>
      </div>
      <form action={action}>
        <button
          type="submit"
          className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
        >
          Run action
        </button>
      </form>
    </div>
  );
}
