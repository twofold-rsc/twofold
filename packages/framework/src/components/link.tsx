"use client";

import { LinkHTMLAttributes, MouseEvent, ReactNode, forwardRef } from "react";
import { useRouter } from "../hooks/use-router";

type Props = {
  href: string;
  replace?: boolean;
  children: ReactNode;
} & LinkHTMLAttributes<HTMLAnchorElement>;

let Link = forwardRef<HTMLAnchorElement, Props>(function LinkWithRef(
  { href, children, replace, onClick, ...props },
  ref,
) {
  let router = useRouter();
  let using: "replace" | "navigate" = replace ? "replace" : "navigate";

  return (
    <a
      {...props}
      ref={ref}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
          onClick(e);
        }

        if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.defaultPrevented) {
          e.preventDefault();
          router[using](href);
        }
      }}
    >
      {children}
    </a>
  );
});

export default Link;
