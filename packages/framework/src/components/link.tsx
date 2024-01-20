"use client";

import { LinkHTMLAttributes, MouseEvent, ReactNode, forwardRef } from "react";
import { useRouter } from "../hooks/use-router";

type Props = {
  href: string;
  children: ReactNode;
} & LinkHTMLAttributes<HTMLAnchorElement>;

let Link = forwardRef<HTMLAnchorElement, Props>(
  ({ href, children, onClick, ...props }, ref) => {
    let { navigate } = useRouter();

    return (
      <a
        {...props}
        ref={ref}
        href={href}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          if (onClick) {
            onClick(e);
          }

          if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            navigate(href);
          }
        }}
      >
        {children}
      </a>
    );
  },
);

export default Link;
