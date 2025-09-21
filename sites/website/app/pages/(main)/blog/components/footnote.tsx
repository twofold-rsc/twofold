import { ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";

export function Footnote({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="not-prose mx-px mb-px inline-block rounded bg-gray-200 px-1 py-0.5 align-text-top text-xs leading-none text-gray-900">
        {id}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={8}
          collisionPadding={20}
          className="not-prose max-w-xs rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow [&_a]:text-blue-500 [&_a]:underline [&_a]:decoration-blue-300"
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
