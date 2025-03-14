import "client-only";
import { use, useEffect, useRef } from "react";
import { FlashContext, JSONValue, Message } from "../components/flash-provider";
import { z, ZodTypeAny } from "zod";

type Result<T = JSONValue> = {
  messagesWithId: Message<T>[];
  messages: T[];
  removeMessageById: (id: string) => void;
};

type Options = {
  clearAfter?: number;
};

export function useFlash(options?: Options): Result<JSONValue>;
export function useFlash<T extends ZodTypeAny>(
  options: Options & {
    schema?: T;
  },
): Result<z.infer<T>>;

export function useFlash<T extends ZodTypeAny>(
  options?: Options & {
    schema?: T;
  },
): Result {
  let schema = options?.schema;
  let clearAfter = options?.clearAfter;
  let { removeMessageById, messagesWithId } = use(FlashContext);

  let parsedMessagesWithId = schema
    ? messagesWithId
        .map(({ id, content }) => {
          let data = schema.safeParse(content);
          return data.success ? { id, content: data.data } : undefined;
        })
        .filter((m): m is Message<z.infer<T>> => m !== undefined)
    : messagesWithId;

  let messages = parsedMessagesWithId.map(({ content }) => content);

  let scheduledRemovals = useRef<{ timeoutId: NodeJS.Timeout; id: string }[]>(
    [],
  );

  useEffect(() => {
    if (!clearAfter) return;

    let ids = parsedMessagesWithId.map(({ id }) => id);
    for (let id of ids) {
      let isScheduled = scheduledRemovals.current.some((r) => r.id === id);
      if (!isScheduled) {
        let timeoutId = setTimeout(() => {
          scheduledRemovals.current = scheduledRemovals.current.filter(
            (r) => r.id !== id,
          );
          removeMessageById(id);
        }, 5000);

        scheduledRemovals.current.push({
          timeoutId,
          id,
        });
      }
    }

    return () => {
      for (let { timeoutId } of scheduledRemovals.current) {
        clearTimeout(timeoutId);
      }
      scheduledRemovals.current = [];
    };
  }, [parsedMessagesWithId, removeMessageById, clearAfter]);

  return {
    messagesWithId: parsedMessagesWithId,
    messages,
    removeMessageById,
  };
}

export function flash(message: JSONValue) {
  if (window.__twofold?.flash) {
    window.__twofold.flash(message);
  }
}
