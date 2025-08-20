"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "../hooks/use-router";
import z from "zod";

declare global {
  interface Window {
    $RefreshRuntime$: {
      performReactRefresh(): Promise<void>;
    };
    __twofold__chunk_reload__: (chunk: string) => Promise<any>;
  }
}

let messagesSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("welcome"),
    key: z.string(),
  }),
  z.object({
    type: z.literal("changes"),
    key: z.string(),
    changes: z.object({
      rscFiles: z.object({
        added: z.array(z.string()),
      }),
      chunkFiles: z.object({
        added: z.array(z.string()),
      }),
      chunkIds: z.object({
        added: z.array(z.string()),
      }),
      cssFiles: z.object({
        added: z.array(z.string()),
        removed: z.array(z.string()),
      }),
    }),
  }),
]);

type Message = z.infer<typeof messagesSchema>;
type ChangesMessage = Extract<Message, { type: "changes" }>;
type WelcomeMessage = Extract<Message, { type: "welcome" }>;

export default function DevReload() {
  let key = useRef<string>(null);

  let [cssToCleanup, setCSSToCleanup] = useState<string[]>([]);

  let { refresh } = useRouter();

  useEffect(() => {
    cssToCleanup.forEach((file) => removeCSSFile(file));
    if (cssToCleanup.length > 0) {
      setCSSToCleanup([]);
    }
  }, [cssToCleanup]);

  useEffect(() => {
    let eventSource = new EventSource("/__dev/reload");

    async function handleWelcome(message: WelcomeMessage) {
      if (key.current && key.current !== message.key) {
        // we got disconnected and the version has changed
        key.current = message.key;
        refresh();
      }
    }

    async function handleChanges(message: ChangesMessage) {
      let changes = message.changes;
      key.current = message.key;
      if (changes.rscFiles.added.length > 0) {
        startTransition(async () => {
          refresh();
          setCSSToCleanup((c) => [...c, ...changes.cssFiles.removed]);

          // if any of the added files had previous been removed, then we
          // have to manually add them back. reason being react still
          // thinks they are rendered, and will not automatically re-insert
          // them.
          let addingCSS = changes.cssFiles.added.map(addCSSFile);
          await Promise.all(addingCSS);
        });
      } else if (
        changes.chunkFiles.added.length > 0 ||
        changes.chunkIds.added.length > 0 ||
        changes.cssFiles.added.length > 0
      ) {
        // add new css
        let cssFiles = changes.cssFiles.added.map(addCSSFile);

        // reload js modules
        let chunkModules = changes.chunkFiles.added.map(reloadChunkFile);

        // reload client components
        let clientModules = changes.chunkIds.added.map(reloadClientComponent);

        await Promise.all([...cssFiles, ...chunkModules, ...clientModules]);

        startTransition(async () => {
          // refresh react
          await window.$RefreshRuntime$.performReactRefresh();

          // remove old css
          setCSSToCleanup((c) => [...c, ...changes.cssFiles.removed]);
        });
      } else {
        // some other change, like a non-frontent file (env, etc)
        refresh();
      }
    }

    eventSource.onmessage = (event) => {
      let data = JSON.parse(event.data);
      let result = messagesSchema.safeParse(data);

      if (result.error) {
        console.warn("Could not parse dev reload message", result.error);
        return;
      }

      let message = result.data;

      if (message.type === "changes") {
        handleChanges(message);
      } else if (message.type === "welcome") {
        handleWelcome(message);
      }
    };

    eventSource.onerror = (error) => {
      // ignore
    };

    return () => {
      eventSource.close();
    };
  }, [refresh]);

  return null;
}

function reloadChunkFile(chunkFile: string) {
  return import(`/__tf/assets/chunks/${chunkFile}?v=${Date.now()}`);
}

function reloadClientComponent(chunkId: string) {
  return window.__twofold__chunk_reload__(chunkId);
}

let cssBase = "/__tf/assets/styles/";

function removeCSSFile(file: string) {
  let hrefToRemove = `${cssBase}${file}`;

  let links = document.getElementsByTagName("link");

  for (let i = 0; i < links.length; i++) {
    let link = links[i];

    let href = link.getAttribute("href");
    if (href && href === hrefToRemove) {
      link.disabled = true;
      link.parentNode?.removeChild(link);
    }
  }
}

function addCSSFile(href: string) {
  return new Promise<void>((resolve, reject) => {
    let link = document.createElement("link");
    let head = document.getElementsByTagName("head")[0];

    if (!head) {
      reject(new Error("No <head> element found"));
    }

    link.href = `${cssBase}${href}`;
    link.onload = () => {
      resolve();
    };
    link.onerror = reject;
    link.rel = "stylesheet";

    head.appendChild(link);
  });
}
