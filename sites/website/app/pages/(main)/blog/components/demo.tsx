import clsx from "clsx";
import { ReactNode } from "react";

export function DemoContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative -mx-2 flex items-center justify-center rounded-b-md border-x-2 border-b-2 border-gray-200 p-8 sm:mx-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
