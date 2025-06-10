"use client";

import { JSX, ReactNode, useActionState } from "react";
import { getDemo1 } from "./demo1-action";
import { motion } from "framer-motion";
import clsx from "clsx";

export function Demo1({ children }: { children: ReactNode }) {
  const [jsx, action] = useActionState(
    (prev: JSX.Element | null, action: "run" | "reset") => {
      if (action === "run") {
        return getDemo1();
      } else if (action === "reset") {
        return null;
      } else {
        return prev;
      }
    },
    null,
  );

  return (
    <div className="not-prose relative">
      <div>{children}</div>
      <div className="relative flex items-center justify-center rounded-b-md border-x-2 border-b-2 border-gray-200 p-8">
        <form>
          <motion.div
            initial="show"
            animate={jsx ? "hide" : "show"}
            variants={{
              show: {
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                transition: { duration: 0 },
              },
              hide: { backgroundColor: "rgba(255, 255, 255, 0)" },
            }}
            className={clsx(
              "absolute inset-0 flex items-center justify-center rounded-b",
              jsx ? "pointer-events-none" : "pointer-events-auto",
            )}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              type="submit"
              formAction={() => action("run")}
              initial="show"
              animate={jsx ? "hide" : "show"}
              variants={{
                show: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0 },
                },
                hide: { opacity: 0, scale: 0.96 },
              }}
              className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white shadow-lg"
            >
              Try it out
            </motion.button>
          </div>

          {jsx ? (
            <div>
              {jsx}
              <motion.button
                type="submit"
                formAction={() => action("reset")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-1.5 right-3 text-sm text-gray-500 transition-colors hover:text-blue-500 hover:underline"
              >
                Reset
              </motion.button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i}>
                  <span className="flex size-8 items-center justify-center rounded border border-amber-200 bg-amber-50">
                    ⏳
                  </span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
