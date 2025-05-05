"use client";

import { ReactNode, startTransition, useActionState, useEffect } from "react";
import clsx from "clsx";

function serializePromise(promise: Promise<string>) {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue("promise:create");

      const value = await promise;
      controller.enqueue(`promise:resolve:${value}`);
      controller.close();
    },
  });

  return stream;
}

function deserializePromise(stream: ReadableStream) {
  const reader = stream.getReader();
  let promise;
  let resolver: (arg: string) => void;
  let unlock: (arg?: Promise<string>) => void;

  let didUnlock = false;

  let lockUntilReady = new Promise<{ promise: Promise<string> | undefined }>(
    (resolve) => {
      unlock = (arg) => {
        resolve({ promise: arg });
        didUnlock = true;
      };
    },
  );

  async function readStream() {
    let { done, value } = await reader.read();

    if (done) {
      if (!didUnlock) {
        unlock();
      }
      return;
    }

    if (value === "promise:create") {
      promise = new Promise<string>((resolve) => {
        resolver = resolve;
      });
      unlock(promise);
    } else if (value.startsWith("promise:resolve:")) {
      const result = value.split(":")[2];
      resolver(result);
    }

    readStream();
  }

  readStream();

  return lockUntilReady;
}

type State = {
  log: string[];
  next: string | null;
  originalPromise: Promise<string>;
  stream: ReadableStream;
  recreatedPromise?: Promise<string | undefined>;
  recreatedValue?: string;
};

export function Demo3({ children }: { children: ReactNode }) {
  const [state, action] = useActionState(
    async (prev: State | null, action: string) => {
      if (action === "serialize") {
        const promise = new Promise<string>((resolve) => {
          setTimeout(() => resolve("Hello!"), 1_500);
        });

        return {
          log: ["Serializing the promise...", "Done!", ""],
          next: "deserialize",
          originalPromise: promise,
          stream: serializePromise(promise),
        };
      } else if (action === "deserialize" && prev) {
        const recreated = await deserializePromise(prev.stream);

        return {
          ...prev,
          log: [
            ...prev.log,
            "Recreating the promise...",
            "Done!",
            "",
            "Waiting for the promise to resolve...",
          ],
          next: "await",
          recreatedPromise: recreated.promise,
        };
      } else if (action === "await" && prev) {
        const value = await prev.recreatedPromise;
        return {
          ...prev,
          log: [...prev.log, `Resolved with: ${value}`],
          next: null,
          recreatedValue: value,
        };
      } else if (action === "reset") {
        return null;
      } else {
        return prev;
      }
    },
    null,
  );

  useEffect(() => {
    const next = state?.next;
    if (next) {
      startTransition(() => action(next));
    }
  }, [state?.next, action]);

  return (
    <div className="not-prose relative">
      <div>{children}</div>
      <div
        className={clsx(
          "relative flex min-h-[250px] rounded-b-md border-x-2 border-b-2 border-gray-200 md:min-h-[228px]",
          state?.log ? "" : "items-center justify-center",
        )}
      >
        {state?.log ? (
          <div className="h-full w-full p-8">
            {state.log.map((line, i) => (
              <p
                key={i}
                className={clsx(
                  "block overflow-x-scroll font-mono text-sm",
                  line.startsWith("Resolved with:")
                    ? "text-emerald-500"
                    : "text-gray-900",
                  line === "" ? "mt-2" : "mt-1",
                )}
              >
                {line}
              </p>
            ))}
            <form
              className="absolute top-1.5 right-3"
              action={() => action("reset")}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 transition-colors hover:text-blue-500 hover:underline"
              >
                Reset
              </button>
            </form>
          </div>
        ) : (
          <form action={() => action("serialize")}>
            <button className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white">
              Try it out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
