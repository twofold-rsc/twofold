"use client";

import Link from "@twofold/framework/link";
import { useRouter } from "@twofold/framework/use-router";
import { ReactNode } from "react";

export function DocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  let { path } = useRouter();

  return (
    <Link href={href} className={path.startsWith(href) ? "text-blue-500" : ""}>
      {children}
    </Link>
  );
}
