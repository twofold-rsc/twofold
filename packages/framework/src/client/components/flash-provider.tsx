"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

type Message = {
  id: string;
  message: string;
};

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    flash?: (message: string) => void;
  }
}

export const FlashContext = createContext<{
  messages: string[];
  messagesWithId: Message[];
  removeMessageById: (id: string) => void;
}>({
  messages: [],
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
  // ideally we would derive all this from cookieStore, but that's not
  // supported by all browsers yet. for the time being we'll maintain two
  // pieces of state (flashCookies from the server and clientMessagesWithId)
  let [removedIds, setRemovedIds] = useState<string[]>([]);
  let [clientMessagesWithId, setClientMessagesWithId] = useState<Message[]>([]);

  let serverMessagesWithId = flashCookies
    .filter((cookie) => !removedIds.includes(getIdFromName(cookie.name)))
    .filter((cookie) =>
      clientMessagesWithId.every((m) => m.id !== getIdFromName(cookie.name)),
    )
    .map((cookie) => {
      let id = getIdFromName(cookie.name);
      return { id, message: cookie.value ?? "" };
    });

  let messagesWithId = [...serverMessagesWithId, ...clientMessagesWithId];
  let messages = messagesWithId.map((m) => m.message);

  function removeMessageById(id: string) {
    setRemovedIds((c) => [...c, id]);
    setClientMessagesWithId((c) => c.filter((m) => m.id !== id));
    deleteCookie(`_tf_flash_${id}`);
  }

  let addMessage = useCallback((message: string) => {
    let id = Math.random().toString(36).slice(2);
    setClientMessagesWithId((c) => [...c, { id, message }]);
    addCookie(`_tf_flash_${id}`, message);
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
    <FlashContext.Provider
      value={{
        messages,
        messagesWithId: messagesWithId,
        removeMessageById,
      }}
    >
      {children}
    </FlashContext.Provider>
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
