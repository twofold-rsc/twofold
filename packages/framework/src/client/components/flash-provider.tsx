"use client";

import { createContext, ReactNode, useState } from "react";

type Message = {
  id: string;
  message: string;
};

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
  let [removedIds, setRemovedIds] = useState<string[]>([]);

  let messagesWithId = flashCookies
    .filter((cookie) => !removedIds.includes(getIdFromName(cookie.name)))
    .map((cookie) => {
      let id = getIdFromName(cookie.name);
      return { id, message: cookie.value ?? "" };
    });

  let messages = messagesWithId.map((m) => m.message);

  function removeMessageById(id: string) {
    setRemovedIds((c) => [...c, id]);
    deleteCookie(`_tf_flash_${id}`);
  }

  // add client side message
  function addMessage(message: string) {
    let id = Math.random().toString(36).slice(2);
    document.cookie = `_tf_flash_${id}=${message}; path=/; max-age=86400`;
  }

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
}
