"use client";

import clsx from "clsx";
import { Browser } from "../../components/browser";
import * as Switch from "@radix-ui/react-switch";
import {
  JSX,
  ReactNode,
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
} from "react";
import { getDemo2 } from "./demo2-action";
import { DownArrow } from "./arrows";
import { motion, useScroll, useTransform } from "framer-motion";
import Spinner from "../../../../../components/spinner";
import { useFormStatus } from "react-dom";

type Action =
  | {
      type: "run";
      formData: FormData;
    }
  | {
      type: "reset";
    }
  | {
      type: "back";
    }
  | {
      type: "forward";
    };

type State =
  | {
      jsx: null;
      stream: boolean;
      prevJsx: null | Promise<JSX.Element>;
    }
  | {
      jsx: Promise<JSX.Element>;
      stream: boolean;
      prevJsx: null | Promise<JSX.Element>;
    };

export function Demo2() {
  const browserContentRef = useRef(null);
  const { scrollY } = useScroll({
    container: browserContentRef,
    axis: "y",
  });

  const arrowOpacityMV = useTransform(scrollY, [0, 150], [1, 0], {
    clamp: true,
  });

  const [state, action] = useActionState(
    (prev: State, action: Action): State => {
      if (action.type === "run") {
        return {
          ...prev,
          jsx: getDemo2(action.formData),
          stream: action.formData.get("stream-comments") === "on",
        };
      } else if (action.type === "reset") {
        return {
          jsx: null,
          stream: true,
          prevJsx: null,
        };
      } else if (action.type === "back") {
        return {
          ...prev,
          jsx: null,
          prevJsx: prev.jsx,
        };
      } else if (action.type === "forward" && prev.prevJsx) {
        return {
          ...prev,
          jsx: prev.prevJsx,
        };
      } else {
        return prev;
      }
    },
    {
      jsx: null,
      stream: true,
      prevJsx: null,
    },
  );

  return (
    <div className="not-prose">
      <div className="-mx-3 md:-mx-8">
        <Browser
          url="https://twofoldframework.com/blog"
          onBack={state.jsx ? () => action({ type: "back" }) : void 0}
          onForward={
            state.prevJsx && !state.jsx
              ? () => action({ type: "forward" })
              : void 0
          }
          onRefresh={state.jsx ? () => action({ type: "reset" }) : void 0}
        >
          <div
            className="relative flex h-full max-h-[400px] grow flex-col overflow-y-scroll rounded-b-lg"
            ref={browserContentRef}
          >
            {state.jsx ? (
              <>
                {state.jsx}
                {state.stream && (
                  <motion.div
                    animate={{
                      y: [0, 4, -4, 4, -2.5, 2.5, 0],
                    }}
                    style={{
                      opacity: arrowOpacityMV,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={clsx(
                      "absolute right-6 bottom-36 text-red-500",
                      "rounded bg-white/75 p-2.5 ring ring-black/10 backdrop-blur-[4px] sm:p-0 sm:shadow-none sm:ring-0",
                    )}
                  >
                    <div className="relative">
                      <div className="font-handwriting text-center text-xl leading-tight">
                        <p>Scroll down to</p>
                        <p>see comments</p>
                      </div>
                      <div className="absolute -bottom-[90px] -left-[12px] -rotate-[80deg] sm:-bottom-[78px]">
                        <DownArrow className="h-8 text-red-500" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="flex h-full w-full grow flex-col items-center justify-center px-5 py-4">
                <EmptyState
                  stream={state.stream}
                  loadAction={(formData) => {
                    action({ type: "run", formData: formData });
                  }}
                />
              </div>
            )}
          </div>
        </Browser>
      </div>
      <div className="mt-4 text-center"></div>
    </div>
  );
}

function EmptyState({
  loadAction,
  stream,
}: {
  stream: boolean;
  loadAction: (formData: FormData) => void;
}) {
  return (
    <form className="space-y-5" action={loadAction}>
      <h3 className="text-lg leading-none font-medium tracking-tight text-gray-900">
        Blog post demo
      </h3>
      <div className="flex items-center space-x-2">
        <Switch.Root
          defaultChecked={stream ? true : undefined}
          name="stream-comments"
          id="demo-2-stream-comments"
          className={clsx(
            "h-full w-7 rounded-full p-0.5",
            "data-[state=unchecked]:bg-gray-200",
            "data-[state=checked]:bg-blue-200",
          )}
        >
          <Switch.Thumb
            className={clsx(
              "block size-3 rounded-full transition-all",
              "data-[state=unchecked]:bg-gray-400",
              "data-[state=checked]:translate-x-3 data-[state=checked]:bg-blue-500",
            )}
          />
        </Switch.Root>
        <label htmlFor="demo-2-stream-comments" className="text-sm select-none">
          Lazily stream comments with Suspense
        </label>
      </div>
      <div>
        <SubmitButton>Load the blog</SubmitButton>
      </div>
    </form>
  );
}

function SubmitButton({ children }: { children: ReactNode }) {
  const isPending = useDelayedPending(100);

  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
    >
      <Spinner loading={isPending}>{children}</Spinner>
    </button>
  );
}

function useDelayedPending(delay: number) {
  let { pending } = useFormStatus();
  let [delayedPending, setDelayedPending] = useOptimistic(false);

  useEffect(() => {
    if (!pending) return;

    let timeoutId = setTimeout(() => {
      startTransition(() => {
        setDelayedPending(pending);
      });
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, pending, setDelayedPending]);

  return delayedPending;
}
