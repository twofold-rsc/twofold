"use client";

import { ComponentProps, MouseEvent, ReactNode, Ref } from "react";
import { useRouter } from "../hooks/use-router";

type Props = ComponentProps<"a"> & {
  ref?: Ref<HTMLAnchorElement>;
  href: string;
  replace?: boolean;
  children: ReactNode;
};

export default function Link({
  href,
  children,
  replace,
  onClick,
  ref,
  ...props
}: Props) {
  let router = useRouter();
  let using: "replace" | "navigate" = replace ? "replace" : "navigate";

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (onClick) {
      onClick(e);
    }

    let isLocal = isLocalLink(href);

    if (
      e.button === 0 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.defaultPrevented &&
      isLocal
    ) {
      e.preventDefault();
      router[using](href);
    }
  }

  return (
    <a {...props} ref={ref} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}

function isLocalLink(path: string) {
  try {
    let urlObject = new URL(path, window.location.origin);
    return urlObject.origin === window.location.origin;
  } catch (e) {
    return false;
  }
}
