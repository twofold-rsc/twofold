import { ReactNode } from "react";

export default function NestedLayoutLevel2({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>
      <span className="bg-red-500 px-1.5 py-1 text-white">Level 2</span>
      <div className="border border-red-500 p-4">{children}</div>
    </div>
  );
}
