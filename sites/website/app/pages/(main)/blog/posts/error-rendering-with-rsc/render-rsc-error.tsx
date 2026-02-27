"use client";

import Spinner from "@/app/components/spinner";
import { ReactNode, Suspense, use, useState } from "react";
// @ts-expect-error - no types
import { createFromReadableStream } from "react-server-dom-webpack/client";
import { ErrorBoundary } from "./error-boundary";

const chunks = [
  `0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/rsc.js",9131,9,0,0,false]],"env":"Server","owner":null}`,
];

export function RenderRSCError() {
  return (
    <div className="not-prose my-6">
      <div className="-mx-2 flex min-h-96 items-center justify-center rounded-md border-2 border-gray-200 p-8 sm:mx-0">
        <Renderer />
      </div>
    </div>
  );
}

function Renderer() {
  let [usableTree, setUsableTree] = useState();

  async function create() {
    let stream = new ReadableStream({
      async start(controller) {
        // await new Promise((r) => setTimeout(r, 1000));
        controller.enqueue(chunks[0]);
        controller.enqueue("\n");
      },
    });

    let usableTree = createFromReadableStream(
      stream.pipeThrough(new TextEncoderStream()),
    );

    setUsableTree(usableTree);
  }

  function reset() {
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
            Render error stream
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="space-y-1 rounded bg-black p-4 font-mono font-bold">
            <div className="text-sm text-white">RSC Stream</div>
            <div className="text-xs font-bold wrap-break-word text-red-200">
              {`0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/index.js",9130,9,0,0,false]],"env":"Server","owner":null}`}
            </div>
          </div>

          <div className="my-2 flex items-center justify-center">&#8595;</div>

          <div className="min-h-[152px] rounded border border-slate-200 bg-slate-50 p-4">
            <div className="font-mono text-sm font-bold">Browser render</div>
            <div className="mt-1">
              <Suspense fallback={<Loading />}>
                <ErrorBoundary onReset={reset}>
                  <Tree usableTree={usableTree} />
                </ErrorBoundary>
              </Suspense>
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

function Loading() {
  return (
    <div className="flex items-center justify-start space-x-2">
      <Spinner />
      <span className="text-gray-600">Rendering...</span>
    </div>
  );
}
