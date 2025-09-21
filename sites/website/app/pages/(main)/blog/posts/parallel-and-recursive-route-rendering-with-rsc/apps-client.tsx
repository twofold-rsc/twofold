"use client";

import Spinner from "@/app/components/spinner";
import {
  createContext,
  ReactNode,
  startTransition,
  useContext,
  useEffect,
  useOptimistic,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";
import { Browser } from "../../components/browser";
import { AnimatePresence, motion } from "motion/react";
import { useFlash } from "@twofold/framework/flash";
import z from "zod";
import { useRouter } from "@twofold/framework/use-router";
import { Arrow } from "../../components/arrows";

export function DemoBrowser({ children }: { children: ReactNode }) {
  let { path, searchParams, replace } = useRouter();
  let postId = searchParams.get("postId") || undefined;

  function reloadBrowser() {
    let reloadSearchParams = new URLSearchParams();

    if (postId) {
      reloadSearchParams.set("postId", postId);
    }

    replace(`${path}?${reloadSearchParams}`, {
      scroll: false,
      mask: path,
    });
  }

  return (
    <div className="relative">
      <Browser url="http://localhost:3000/" onRefresh={reloadBrowser}>
        {children}
      </Browser>
    </div>
  );
}

export function WaterfallBrowser({ children }: { children: ReactNode }) {
  let { path, searchParams, replace } = useRouter();
  let postId = searchParams.get("postId") || undefined;
  let reloadCount = useRef(0);

  function reloadBrowser() {
    let reloadSearchParams = new URLSearchParams();

    if (postId) {
      reloadSearchParams.set("postId", postId);
    }

    reloadCount.current = reloadCount.current + 1;
    reloadSearchParams.set("app.suspenseKey", `reload-${reloadCount.current}`);
    reloadSearchParams.set("app.waterfall", "1000");

    replace(`${path}?${reloadSearchParams}`, {
      scroll: false,
      mask: path,
    });
  }

  return (
    <div className="relative">
      <div className="relative z-10 mt-18">
        <div className="absolute -top-[54px] right-[16px] transition-opacity group-has-[[data-loading]]:opacity-80 md:-top-[54px] md:right-[200px]">
          <div className="relative">
            <span
              onClick={reloadBrowser}
              className="font-handwriting absolute right-[74px] bottom-[42px] text-xl font-semibold whitespace-nowrap text-red-500"
            >
              Refresh to see the waterfall
            </span>
            <Arrow
              onClick={reloadBrowser}
              className="w-18 rotate-[180deg] text-red-500"
            />
          </div>
        </div>
      </div>

      <Browser url="http://localhost:3000/" onRefresh={reloadBrowser}>
        {children}
      </Browser>
    </div>
  );
}

export function StackedBrowser({ stack }: { stack: ReactNode[] }) {
  let { path, searchParams, replace } = useRouter();
  let postId = searchParams.get("postId") || undefined;
  let reloadCount = useRef(0);

  function reloadBrowser() {
    let reloadSearchParams = new URLSearchParams();

    if (postId) {
      reloadSearchParams.set("postId", postId);
    }

    reloadCount.current = reloadCount.current + 1;
    reloadSearchParams.set(
      "stack.suspenseKey",
      `reload-${reloadCount.current}`,
    );
    reloadSearchParams.set("stack.waterfall", "1200");

    replace(`${path}?${reloadSearchParams}`, {
      scroll: false,
      mask: path,
    });
  }

  return (
    <div className="relative">
      <div className="relative z-10 mt-18">
        <div className="absolute -top-[54px] right-[16px] transition-opacity group-has-[[data-loading]]:opacity-80 md:-top-[54px] md:right-[200px]">
          <div className="relative">
            <span
              onClick={reloadBrowser}
              className="font-handwriting absolute right-[74px] bottom-[42px] text-xl font-semibold whitespace-nowrap text-red-500"
            >
              Refresh to render in parallel
            </span>
            <Arrow
              onClick={reloadBrowser}
              className="w-18 rotate-[180deg] text-red-500"
            />
          </div>
        </div>
      </div>

      <Browser url="http://localhost:3000/" onRefresh={reloadBrowser}>
        <StackReader stack={stack} />
      </Browser>
    </div>
  );
}

const StackContext = createContext<ReactNode[]>([]);

function StackReader({ stack }: { stack: ReactNode[] }) {
  const [first, ...rest] = stack;

  return rest.length > 0 ? (
    <StackContext value={rest}>{first}</StackContext>
  ) : (
    first
  );
}

export function FlashAlerts({ demoId }: { demoId: number }) {
  let { messagesWithId, removeMessageById } = useFlash({
    schema: z.object({
      demoId: z.number().refine((id) => id === demoId),
      type: z.literal("demo"),
      demo: z.literal("route-rendering-blog-post"),
      message: z.string(),
    }),
    clearAfter: 3000,
  });

  function dismiss() {
    messagesWithId.forEach((msg) => removeMessageById(msg.id));
  }

  let latestMessage = messagesWithId[0];

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {latestMessage && (
          <motion.div
            key={latestMessage.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 rounded bg-white px-4 py-2 text-sm shadow ring-1 ring-black/10"
          >
            <span>{latestMessage.content.message}</span>
            <div className="mt-1.5 text-right">
              <button
                className="text-right text-xs text-gray-500 hover:text-gray-800"
                onClick={dismiss}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  let isPending = useDelayedPending(120);

  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
    >
      <Spinner loading={isPending}>{children}</Spinner>
    </button>
  );
}

export function Placeholder() {
  let stack = useContext(StackContext);

  return <StackReader stack={stack} />;
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
