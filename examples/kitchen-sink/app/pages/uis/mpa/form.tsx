"use client";

import { ReactNode, useActionState } from "react";
import { State } from "./index.page";
import { AnimatePresence, motion } from "framer-motion";

export function Form({
  signup,
}: {
  signup: (prev: State, payload: FormData) => Promise<State>;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    signup,
    {
      username: "",
      success: false,
      error: null,
    },
  );

  return (
    <div className="mt-12 max-w-96">
      <h3 className="text-3xl font-medium tracking-tight">
        Sign up for an account
      </h3>

      <AnimatePresence initial={false} mode="wait">
        {state.success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-3"
          >
            Success! You have signed up for an account.
          </motion.div>
        ) : (
          <motion.form action={formAction} key="form" exit={{ opacity: 0 }}>
            <div className="py-3">
              <motion.div
                initial={state.error ? "error" : "ok"}
                animate={state.error ? "error" : "ok"}
                variants={{
                  ok: {
                    height: 0,
                  },
                  error: {
                    height: "auto",
                    transition: {
                      ease: "easeIn",
                      when: "beforeChildren",
                    },
                  },
                }}
              >
                <motion.div
                  variants={{
                    ok: {
                      opacity: 0,
                    },
                    error: {
                      opacity: 1,
                      x: [0, -5, 5, -5, 5, 0],
                      transition: { duration: 0.6, ease: "easeInOut" },
                    },
                  }}
                  className="flex items-center justify-between border-l-2 border-red-500 bg-red-50 px-3 py-1.5 text-red-500"
                >
                  <span>Error: {state.error}</span>
                </motion.div>
              </motion.div>
            </div>
            <div className="flex items-center justify-between">
              <label className="block text-gray-600" htmlFor="username">
                Username
              </label>
            </div>
            <div className="mt-1">
              <input
                defaultValue={state.username}
                className="w-full rounded border border-gray-200 px-3 py-1.5 shadow"
                name="username"
                autoComplete="off"
              />
            </div>
            <div className="mt-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 font-medium text-white shadow disabled:pointer-events-none disabled:opacity-75"
              >
                <Spinner loading={isPending}>Submit</Spinner>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spinner({
  loading = true,
  children,
  className,
}: {
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  if (!loading) return children;

  const keyframes = `
    @keyframes spinner {
      0% { opacity: 1; }
      100% { opacity: 0.25; }
    }
  `;

  const spinner = (
    <span className={`relative inline-flex ${className ?? "size-4"}`}>
      <style>{keyframes}</style>
      {Array.from(Array(8).keys()).map((i) => (
        <span
          key={i}
          className="absolute top-0 left-[calc(50%-12.5%/2)] h-[100%] w-[12.5%] animate-[spinner_800ms_linear_infinite] before:block before:h-[30%] before:w-[100%] before:rounded-full before:bg-current"
          style={{
            transform: `rotate(${45 * i}deg)`,
            animationDelay: `calc(-${8 - i} / 8 * 800ms)`,
          }}
        />
      ))}
    </span>
  );

  if (!children) return spinner;

  return (
    <span className="relative flex items-center justify-center">
      <span className="invisible">{children}</span>

      <span className="absolute inset-0 flex items-center justify-center">
        {spinner}
      </span>
    </span>
  );
}
