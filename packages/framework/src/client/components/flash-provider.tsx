"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type Message<T = JSONValue> = {
  id: string;
  content: T;
};

declare global {
  interface Window {
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    flash?: (message: JSONValue) => void;
  }
}

export const FlashContext = createContext<{
  messagesWithId: Message[];
  removeMessageById: (id: string) => void;
}>({
  messagesWithId: [],
  removeMessageById: () => {},
});

export function FlashProvider({
  flashCookies,
  children,
}: {
  flashCookies: { name: string; value: string | undefined }[];
  children: ReactNode;
}) {
  // we're going to allow cookies to be removed without refreshing the
  // RSC/flashCookies. Removed Ids tracks cookies that should no longer
  // be displayed
  let [removedIds, setRemovedIds] = useState<string[]>([]);
  let [clientMessagesWithId, setClientMessagesWithId] = useState<Message[]>([]);

  let serverMessagesWithId = flashCookies
    .filter((cookie) => !removedIds.includes(getIdFromName(cookie.name)))
    .filter((cookie) =>
      clientMessagesWithId.every((m) => m.id !== getIdFromName(cookie.name)),
    )
    .map((cookie) => {
      let id = getIdFromName(cookie.name);
      let content;
      try {
        content = cookie.value ? JSON.parse(cookie.value) : "";
      } catch {
        console.warn("Failed to parse flash message", cookie.value);
        content = "";
      }

      return { id, content };
    });

  let messagesWithId = [...serverMessagesWithId, ...clientMessagesWithId];

  let removeMessageById = useCallback((id: string) => {
    setRemovedIds((c) => [...c, id]);
    setClientMessagesWithId((c) => c.filter((m) => m.id !== id));
    deleteCookie(`_tf_flash_${id}`);
  }, []);

  let addMessage = useCallback((content: JSONValue) => {
    let id = Math.random().toString(36).slice(2);
    setClientMessagesWithId((c) => [...c, { id, content }]);
    addCookie(`_tf_flash_${id}`, JSON.stringify(content));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__twofold = {
        ...window.__twofold,
        flash: addMessage,
      };

      return () => {
        if (window.__twofold?.flash === addMessage) {
          delete window.__twofold.flash;
        }
      };
    }
  }, [addMessage]);

  return (
    <FlashContext
      value={{
        messagesWithId,
        removeMessageById,
      }}
    >
      {children}
    </FlashContext>
  );
}

function getIdFromName(name: string) {
  return name.slice("_tf_flash_".length);
}

async function addCookie(name: string, value: string) {
  let win = typeof window === "undefined" ? undefined : window;
  let day = 24 * 60 * 60 * 1000;
  if (win && hasCookieStore(win)) {
    await win.cookieStore.set({
      name,
      value,
      expires: Date.now() + day,
      path: "/",
    });
  } else {
    let expires = new Date(Date.now() + day).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }
}

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

interface CookieStore {
  delete(name: string): Promise<void>;
  set(cookie: {
    name: string;
    value: string;
    expires: number;
    path: string;
  }): Promise<void>;
}
