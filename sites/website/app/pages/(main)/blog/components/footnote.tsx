"use client";

import { ReactNode } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";

export function Footnote({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <HoverCard.Root openDelay={200} closeDelay={200}>
      <HoverCard.Trigger className="not-prose mx-px mb-px inline-block rounded bg-gray-200 px-1 py-0.5 align-text-top text-xs leading-none text-gray-900">
        {id}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={8}
          collisionPadding={20}
          className="not-prose max-w-xs rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow [&_a]:text-blue-500 [&_a]:underline [&_a]:decoration-blue-300"
        >
          {children}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
