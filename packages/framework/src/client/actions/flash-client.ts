import "client-only";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export function useFlash() {
  let [messages, setMessages] = useState<{ id: string; message: string }[]>([]);
  useEffect(() => {
    if ("cookieStore" in window) {
      window.cookieStore.addEventListener("change", (event) => {
        let newMessages = event.changed
          .filter(
            (change) => change.name.startsWith("_tf_flash_") && change.value,
          )
          .map((change) => {
            let id = change.name.slice("_tf_flash_".length);
            let value = decodeURIComponent(change.value);
            return { id, message: value };
          })
          .flat();

        // console.log("newMessages", newMessages);

        if (newMessages) {
          setMessages((c) => [...c, ...newMessages]);
          newMessages.forEach(({ id }) => {
            window.cookieStore.delete(`_tf_flash_${id}`);
          });
        }
      });
    }
  }, []);

  function removeMessage(id: string) {
    setMessages((c) => c.filter((m) => m.id !== id));
  }

  return { messages, removeMessage };
}

export function flash(message: string) {
  console.log("client side flash");
}

function useInterval(callback: () => void, delay: number | null) {
  let callbackRef = useRef<() => void>(() => callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(callbackRef.current, delay);
    return () => clearInterval(id);
  }, [delay]);
}
// useSyncExternalStore
