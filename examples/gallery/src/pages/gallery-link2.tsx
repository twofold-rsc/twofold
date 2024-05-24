"use client";

import Link from "@twofold/framework/link";
import { ReactNode, startTransition, use } from "react";
import { useRouter } from "@twofold/framework/use-router";
import { ViewTransitionsContext } from "./providers/animation";

export function GalleryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  let { navigate } = useRouter();
  let startViewTransition = use(ViewTransitionsContext);

  function navigateToGallery() {
    startViewTransition(() => {
      navigate(href);
    });
  }

  return (
    <Link
      href={href}
      className="relative block"
      onClick={(e) => {
        e.preventDefault();
        navigateToGallery();
      }}
    >
      {children}
    </Link>
  );
}
