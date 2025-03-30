import { ReactNode } from "react";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

export function Callout1({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose mt-4 flex space-x-2 rounded border border-gray-200 bg-white p-3 text-sm">
      <div className="shrink-0">
        <ChatBubbleLeftEllipsisIcon className="mt-[3px] size-4 text-gray-500" />
      </div>

      <div>{children}</div>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose rounded-md bg-blue-50 p-4 ring ring-blue-100 ring-inset">
      <div className="flex">
        <div className="shrink-0">
          <ExclamationTriangleIcon
            aria-hidden="true"
            className="mt-[2px] size-5 text-blue-400"
          />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <div className="text-sm text-blue-700">{children}</div>
          {/* <div className="mt-3 text-sm md:mt-0 md:ml-6">
            <a
              href="#"
              className="font-medium whitespace-nowrap text-blue-700 hover:text-blue-600"
            >
              Details
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div> */}
        </div>
      </div>
    </div>
  );
}
