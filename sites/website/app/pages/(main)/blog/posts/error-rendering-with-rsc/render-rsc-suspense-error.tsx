"use client";

import Spinner from "@/app/components/spinner";
import clsx from "clsx";
import { ReactNode, Suspense, use, useState } from "react";
// @ts-expect-error - no types
import { createFromReadableStream } from "react-server-dom-webpack/client";
import { ErrorBoundary } from "./error-boundary";

const chunks = [
  `1:"$Sreact.suspense"`,
  `0:["$","div",null,{"children":[["$","p",null,{"children":"Hello from RSC!"}],["$","$1",null,{"fallback":["$","p",null,{"children":"Waiting for the error..."}],"children":"$L2"}]]}]`,
  `0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/rsc.js",9131,9,0,0,false]],"env":"Server","owner":null}`,
];

export function RenderRSCSuspenseError() {
  return (
    <div className="not-prose my-6">
      <div className="-mx-2 flex min-h-[536px] items-center justify-center rounded-md border-2 border-gray-200 p-8 sm:mx-0 md:min-h-[432px]">
        <Renderer />
      </div>
    </div>
  );
}

function Renderer() {
  let [usableTree, setUsableTree] = useState();
  let [streamText, setStreamText] = useState<string[]>([]);

  async function create() {
    let stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          if (chunk.startsWith("0:E")) {
            await new Promise((r) => setTimeout(r, 2500));
          }
          setStreamText((t) => [...t, chunk]);
          controller.enqueue(chunk);
          controller.enqueue("\n");
        }
      },
    });

    let usableTree = createFromReadableStream(
      stream.pipeThrough(new TextEncoderStream()),
    );

    setUsableTree(usableTree);
  }

  function reset() {
    setStreamText([]);
    setUsableTree(undefined);
  }

  return (
    <div className="w-full">
      {!usableTree ? (
        <div className="flex items-center justify-center">
          <button
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow"
            onClick={create}
          >
            Render suspensed error
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="space-y-1 rounded bg-black p-4 font-mono font-bold">
            <div className="text-sm text-white">RSC Stream</div>
            <div className="min-h-[192px] space-y-2 text-xs font-bold md:min-h-28">
              {streamText.map((line, i) => (
                <div
                  key={i}
                  className={clsx(
                    "wrap-break-word",
                    line.startsWith("0:E")
                      ? "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_2] text-red-200"
                      : "text-green-200",
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="my-2 flex items-center justify-center">&#8595;</div>

          <div className="min-h-[176px] rounded border border-slate-200 bg-slate-50 p-4 md:min-h-[152px]">
            <div className="font-mono text-sm font-bold">Browser render</div>
            <div className="mt-1">
              <ErrorBoundary onReset={reset}>
                <Tree usableTree={usableTree} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tree({ usableTree }: { usableTree: Promise<ReactNode> }) {
  let tree = use(usableTree);

  return tree;
}
