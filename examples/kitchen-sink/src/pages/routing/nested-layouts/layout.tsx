import { ReactNode } from "react";
import Counter from "./counter";
import RunAction from "./run-action";

async function serverAction() {
  "use server";
  let max = 999;
  let min = 100;
  let random = Math.floor(Math.random() * (max - min + 1) + min);
  return `Result ${random}`;
}

export default function NestedLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Nested layouts</h1>
      <div className="mt-6">
        <span className="bg-blue-500 px-1.5 py-1 text-white">
          Nested layout
        </span>
        <div className="border border-blue-500 p-4">
          <div className="flex space-x-4 pb-2">
            <Counter />

            <div className="border border-dashed border-purple-500 p-4">
              <h3 className="text-sm text-purple-500">Browser element state</h3>
              <div className="mt-2">
                <input className="rounded border border-gray-200 px-2 py-1 text-sm" />
              </div>
            </div>

            <RunAction action={serverAction} />
          </div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
