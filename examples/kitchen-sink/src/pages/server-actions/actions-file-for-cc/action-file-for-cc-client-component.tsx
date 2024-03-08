"use client";

import { action } from "./actions-file-for-cc";

export default function CCInvokesAction() {
  return (
    <form action={action}>
      <button
        type="submit"
        className="block rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
      >
        Run action
      </button>
    </form>
  );
}
