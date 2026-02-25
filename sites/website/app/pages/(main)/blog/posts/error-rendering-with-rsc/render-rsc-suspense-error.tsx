"use client";

import Spinner from "@/app/components/spinner";
import { Component, ReactNode, Suspense, use, useState } from "react";
// @ts-expect-error - no types
import { createFromReadableStream } from "react-server-dom-webpack/client";

const chunks = [
  `0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/rsc.js",9131,9,0,0,false]],"env":"Server","owner":null}`,
];

export function RenderRSCSuspenseError() {
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
        await new Promise((r) => setTimeout(r, 1000));
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
            Render suspensed error
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="space-y-1 rounded bg-black p-4 font-mono font-bold">
            <div className="text-sm text-white">RSC Stream</div>
            <div className="text-xs font-bold wrap-break-word text-green-200">
              {`0:E{"digest":"","name":"Error","message":"Whoops!","stack":[["MyComponent","/index.js",9130,9,0,0,false]],"env":"Server","owner":null}`}
            </div>
          </div>

          <div className="my-2 flex items-center justify-center">&#8595;</div>

          <div className="rounded border border-slate-200 bg-slate-50 p-4">
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
      <span className="text-gray-600">Loading...</span>
    </div>
  );
}

class ErrorBoundary extends Component<{
  children: ReactNode;
  onReset: () => void;
}> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  reset() {
    this.setState({ error: null });
    this.props.onReset();
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-2">
          <p className="max-w-prose">
            The above RSC Stream contains an error and cannot be rendered by
            your browser.
          </p>
          <button
            className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white"
            onClick={this.reset.bind(this)}
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
