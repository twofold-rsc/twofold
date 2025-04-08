"use client";

import { ComponentProps, ElementType, MouseEvent, ReactNode, Ref } from "react";
import { useRouter } from "../hooks/use-router";

type Props<C extends ElementType> = {
  as?: C;
  ref?: Ref<HTMLAnchorElement>;
  href: string;
  replace?: boolean;
  scroll?: "top" | "preserve";
  mask?: string;
  children?: ReactNode;
} & ComponentProps<C>;

export default function Link<T extends ElementType = "a">({
  as,
  href,
  children,
  replace,
  scroll,
  mask,
  onClick,
  ref,
  ...props
}: Props<T>) {
  let router = useRouter();
  let using: "replace" | "navigate" = replace ? "replace" : "navigate";
  let shouldScroll = !scroll || scroll == "top";

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
      router[using](href, {
        scroll: shouldScroll,
        ...(mask ? { mask: mask } : {}),
      });
    }
  }

  const Tag = as || "a";

  return (
    <Tag {...props} ref={ref} href={mask ? mask : href} onClick={handleClick}>
      {children}
    </Tag>
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
