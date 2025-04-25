"use client";

import { useSyncExternalStore } from "react";

type Data = {
  stream: ReadableStream;
  content: string;
  state: "not-found" | "reading" | "cancelled" | "complete";
  signal: AbortSignal;
  callbacks: Callbacks;
};

type Listener = () => void;

type Callbacks = {
  onContent: (content: string) => void;
  onEnd: (content: string) => void;
};

type Options = Partial<Callbacks> & {
  signal?: AbortSignal;
};

const noOp = () => {};

let streamMap = new Map<string, Data>();
let listeners: Listener[] = [];

export function addStream(stream: ReadableStream, options: Options = {}) {
  let id = generateId();
  const newMap = new Map(streamMap);
  const signal = options.signal ?? new AbortController().signal;
  newMap.set(id, {
    stream,
    content: "",
    signal,
    state: signal.aborted ? "cancelled" : "reading",
    callbacks: normalizeCallbacks(options),
  });

  streamMap = newMap;
  emitChange();

  if (signal.aborted) {
    throw new Error("Stream was cancelled before it could be read");
  }

  signal.addEventListener("abort", () => {
    const newMap = new Map(streamMap);
    const data = newMap.get(id);
    if (data) {
      newMap.set(id, {
        ...data,
        state: "cancelled",
      });
      streamMap = newMap;
      emitChange();
    }
  });

  (async () => {
    for await (const chunk of stream) {
      const newMap = new Map(streamMap);
      const data = newMap.get(id);
      if (data && !data.signal.aborted) {
        const content = data.content ? data.content + chunk : chunk;
        newMap.set(id, {
          ...data,
          content,
        });
        streamMap = newMap;
        emitChange();
        data.callbacks.onContent(content);
      }
    }

    const finalMap = new Map(streamMap);
    const data = finalMap.get(id);
    if (data && !data.signal.aborted) {
      finalMap.set(id, {
        ...data,
        state: "complete",
      });
      streamMap = finalMap;
      emitChange();
      data.callbacks.onEnd(data.content);
    }
  })();

  return id;
}

function normalizeCallbacks(callbacks: Partial<Callbacks>): Callbacks {
  return {
    onContent: callbacks.onContent ?? noOp,
    onEnd: callbacks.onEnd ?? noOp,
  };
}

function subscribe(listener: Listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return streamMap;
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function useStreamStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useStream(id: string) {
  const map = useStreamStore();
  const record = map.get(id);

  return {
    content: record?.content,
    state: record?.state ?? "not-found",
    exists: !!record,
  };
}

export function generateId() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

// polyfill safari to make streams iterable
if (!ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] =
    async function* (): AsyncGenerator<any, undefined, unknown> {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
        return undefined;
      } finally {
        reader.releaseLock();
      }
    };
}
