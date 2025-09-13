"use client";

import Spinner from "@/app/components/spinner";
import {
  ComponentProps,
  createContext,
  ReactElement,
  ReactNode,
  startTransition,
  Suspense,
  useActionState,
  useContext,
  useEffect,
  useOptimistic,
} from "react";
import { useFormStatus } from "react-dom";
import { Browser } from "../../components/browser";
import { AnimatePresence, motion } from "motion/react";
import { useFlash } from "@twofold/framework/flash";
import z from "zod";

let Context = createContext<{
  dispatch: (action: Action) => void;
}>({
  dispatch: () => {},
});

type State = {
  version: number;
  app: ReactNode;
  history: string[];
  postId: string | undefined;
};

type Action =
  | {
      type: "navigate";
      postId: string;
    }
  | { type: "reload" }
  | {
      type: "save";
      postId: string;
      formData: FormData;
    };

export function Client2({
  app,
  reload,
  navigate,
  save,
}: {
  app: ReactElement;
  reload: (postId: string | undefined) => Promise<ReactNode>;
  navigate: (postId: string) => Promise<ReactNode>;
  save: (postId: string, formData: FormData) => Promise<ReactNode>;
}) {
  let [state, dispatch] = useActionState<State, Action>(
    async (prev, action) => {
      if (action.type === "reload") {
        let newApp = await reload(prev.postId);
        return {
          ...prev,
          version: prev.version + 1,
          app: newApp,
        };
      }

      if (action.type === "navigate") {
        let newApp = await navigate(action.postId);
        return {
          ...prev,
          app: newApp,
          history: [...prev.history, action.postId],
        };
      }

      if (action.type === "save") {
        let newApp = await save(action.postId, action.formData);
        return {
          ...prev,
          app: newApp,
        };
      }

      return prev;
    },
    {
      version: 0,
      app,
      history: [],
      postId: undefined,
    },
  );

  return (
    <div className="relative" key={`${state.version}`}>
      <Context
        value={{
          dispatch,
        }}
      >
        <Browser
          url="http://localhost:3000/"
          onRefresh={() => startTransition(() => dispatch({ type: "reload" }))}
        >
          {state.app}
          <FlashAlerts />
        </Browser>
      </Context>
    </div>
  );
}

type StackedState = {
  version: number;
  stack: ReactNode[];
  history: string[];
  postId: string | undefined;
};

export function StackedApp({
  stack,
  reload,
  navigate,
  save,
}: {
  stack: ReactNode[];
  reload: (postId: string | undefined) => Promise<ReactNode[]>;
  navigate: (postId: string) => Promise<ReactNode[]>;
  save: (postId: string, formData: FormData) => Promise<ReactNode[]>;
}) {
  let [state, dispatch] = useActionState<StackedState, Action>(
    async (prev, action) => {
      if (action.type === "reload") {
        let stack = await reload(prev.postId);
        return {
          ...prev,
          version: prev.version + 1,
          stack,
        };
      }

      if (action.type === "navigate") {
        let stack = await navigate(action.postId);
        return {
          ...prev,
          stack,
          history: [...prev.history, action.postId],
        };
      }

      if (action.type === "save") {
        let stack = await save(action.postId, action.formData);
        return {
          ...prev,
          stack,
        };
      }

      return prev;
    },
    {
      version: 0,
      stack,
      history: [],
      postId: undefined,
    },
  );

  return (
    <div className="relative" key={`${state.version}`}>
      <Context
        value={{
          dispatch,
        }}
      >
        <Browser
          url="http://localhost:3000/"
          onRefresh={() => startTransition(() => dispatch({ type: "reload" }))}
        >
          <Suspense fallback={<>Loading...</>}>
            <StackReader stack={state.stack} />
            <FlashAlerts />
          </Suspense>
        </Browser>
      </Context>
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

const flashSchema = z.object({
  type: z.literal("demo"),
  demo: z.literal("route-rendering-blog-post"),
  message: z.string(),
});

function FlashAlerts() {
  let { messagesWithId, removeMessageById } = useFlash({
    schema: flashSchema,
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

export function LinkButton({
  postId,
  children,
  ...rest
}: {
  postId: string;
  children: ReactNode;
} & ComponentProps<"button">) {
  let { dispatch } = useContext(Context);

  return (
    <button
      {...rest}
      onClick={() => {
        startTransition(() => {
          dispatch({ type: "navigate", postId });
        });
      }}
    >
      {children}
    </button>
  );
}

export function Form({
  children,
  postId,
  ...rest
}: {
  children: ReactNode;
  postId: string;
} & ComponentProps<"form">) {
  let { dispatch } = useContext(Context);

  return (
    <form
      {...rest}
      action={(formData: FormData) =>
        dispatch({ type: "save", postId, formData })
      }
    >
      {children}
    </form>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  let isPending = useDelayedPending(100);

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
