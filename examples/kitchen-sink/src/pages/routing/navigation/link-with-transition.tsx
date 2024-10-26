"use client";

import Link from "@twofold/framework/link";
import { useRouter } from "@twofold/framework/use-router";
import { MouseEvent, ReactNode, useTransition } from "react";

export function LinkWithNavigation({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  let router = useRouter();
  let [isPending, startTransition] = useTransition();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    startTransition(() => {
      router.navigate(href);
    });
  }

  return (
    <>
      <Link
        onClick={handleClick}
        href={href}
        data-transition-pending={isPending ? "true" : undefined}
        className="text-blue-500 underline data-[transition-pending]:animate-pulse data-[transition-pending]:text-red-500"
      >
        <span>{children}</span>
      </Link>
    </>
  );
}
