"use client";

import { useRouter } from "@twofold/framework/use-router";
import { startTransition } from "react";
import { slowIncrement } from "./actions";
import Link from "@twofold/framework/link";

export function SlowActionForm() {
  let { navigate } = useRouter();

  function formAction() {
    startTransition(async () => {
      navigate(`/routing/use-optimistic-route/slow-action?time=${Date.now()}`);
      await slowIncrement();
    });
  }

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button type="submit" className="bg-black px-3 py-2 text-white">
        Run slow action
      </button>
      <Link
        href="/routing/use-optimistic-route/slow-action"
        className="bg-black px-3 py-2 text-white"
      >
        Reset query
      </Link>
    </form>
  );
}
