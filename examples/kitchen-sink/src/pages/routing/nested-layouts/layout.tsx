import { ReactNode } from "react";
import Counter from "./counter";

export default function NestedLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Nested layouts</h1>
      <div className="mt-6">
        <span className="bg-blue-500 px-1.5 py-1 text-white">
          Nested layout
        </span>
        <div>
          <Counter />
        </div>
        <div className="border border-blue-500 p-4">{children}</div>
      </div>
    </div>
  );
}
