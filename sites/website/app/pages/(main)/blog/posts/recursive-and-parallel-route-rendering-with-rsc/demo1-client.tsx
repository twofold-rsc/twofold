"use client";

import Spinner from "@/app/components/spinner";
import { ReactNode, startTransition, useEffect, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: ReactNode }) {
  const isPending = useDelayedPending(100);

  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
    >
      <Spinner loading={isPending}>{children}</Spinner>
    </button>
  );
}

function useDelayedPending(delay: number) {
  let { pending } = useFormStatus();
  let [delayedPending, setDelayedPending] = useOptimistic(false);

  useEffect(() => {
    if (!pending) return;

    let timeoutId = setTimeout(() => {
      startTransition(() => {
        setDelayedPending(pending);
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, pending, setDelayedPending]);

  return delayedPending;
}
