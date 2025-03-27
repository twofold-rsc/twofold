import { ReactNode } from "react";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose mt-4 flex space-x-2 rounded border border-gray-200 bg-white p-3 text-sm">
      <div className="shrink-0">
        <ChatBubbleLeftEllipsisIcon className="mt-[3px] size-4 text-gray-500" />
      </div>

      <div>{children}</div>
    </div>
  );
}
