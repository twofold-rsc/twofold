"use client";

import { flash } from "@twofold/framework/flash";

function action() {
  flash("This is a client side flash message");
}

export function ClientForm() {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-black/80"
      >
        Client side toast
      </button>
    </form>
  );
}
