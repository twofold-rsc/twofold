import "client-only";
import { useEffect, useRef, useState } from "react";

export function useFlash() {
  const [messagesWithId, setMessagesWithId] = useState<
    { id: string; message: string }[]
  >([]);

  useOnCookie(async (cookie) => {
    if (cookie.name.startsWith("_tf_flash_") && cookie.value) {
      let value = decodeURIComponent(cookie.value);

      let newMessage = {
        id: cookie.name.slice("_tf_flash_".length),
        message: value,
      };

      await deleteCookie(cookie.name);

      setMessagesWithId((c) => [...c, newMessage]);
    }
  });

  function removeMessageById(id: string) {
    setMessagesWithId((c) => c.filter((m) => m.id !== id));
  }

  let messages = messagesWithId.map((m) => m.message);

  return { messages, messagesWithId, removeMessageById };
}

type Callback = (cookie: {
  name: string;
  value: string | undefined;
}) => Promise<void> | void;

function useOnCookie(callback: Callback) {
  let callbackRef = useRef<Callback>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let win = typeof window === "undefined" ? undefined : window;

    if (win && hasCookieStore(win)) {
      const handleChange = (e: CookieChangeEvent) => {
        for (let change of e.changed) {
          callbackRef.current(change);
        }
      };
      win.cookieStore.addEventListener("change", handleChange);
      return () => win.cookieStore.removeEventListener("change", handleChange);
    } else {
      // do interval polling
    }
  }, []);
}

function getSnapshot() {
  if (hasCookieStore(window)) {
    // get from cookie store
    return [];
  } else {
    const cookies = document.cookie.split("; ").map((cookie) => {
      const [name, value] = cookie.split("=");
      return { name, value };
    });

    return cookies
      .filter((cookie) => cookie.name.startsWith("_tf_flash_") && cookie.value)
      .map((cookie) => {
        let id = cookie.name.slice("_tf_flash_".length);
        let value = decodeURIComponent(cookie.value);
        return { id, message: value };
      });
  }
}

export function flash(message: string) {
  console.log("client side flash");
}

// helpers until cookieStore becomes supported in all browsers

async function deleteCookie(name: string) {
  let win = typeof window === "undefined" ? undefined : window;
  if (win && hasCookieStore(win)) {
    await win.cookieStore.delete(name);
  } else {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

function hasCookieStore(
  win: Window,
): win is Window & { cookieStore: CookieStore } {
  return "cookieStore" in win;
}

interface CookieChange {
  name: string;
  value: string | undefined;
}

interface CookieChangeEvent extends Event {
  changed: CookieChange[];
}

interface CookieStore {
  addEventListener(
    type: "change",
    listener: (event: CookieChangeEvent) => void,
  ): void;
  removeEventListener(
    type: "change",
    listener: (event: CookieChangeEvent) => void,
  ): void;
  delete(name: string): Promise<void>;
}
