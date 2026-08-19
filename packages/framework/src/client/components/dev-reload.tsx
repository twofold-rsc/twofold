"use client";

import { startTransition, useEffect, useState } from "react";
import { useDevReload } from "../hooks/use-dev-reload";
import { useRouter } from "../hooks/use-router";

declare global {
  interface Window {
    $RefreshRuntime$: {
      performReactRefresh(): Promise<void>;
    };
    __twofold__chunk_reload__: (chunk: string) => Promise<any>;
  }
}

export default function DevReload() {
  let [cssToCleanup, setCSSToCleanup] = useState<string[]>([]);

  let { refresh } = useRouter();

  useEffect(() => {
    cssToCleanup.forEach((file) => removeCSSFile(file));
    if (cssToCleanup.length > 0) {
      // i really need to find a better way to express this...
      // oxlint-disable-next-line react/react-compiler
      setCSSToCleanup([]);
    }
  }, [cssToCleanup]);

  useDevReload(async (message) => {
    if (message.type === "error") {
      startTransition(async () => {
        refresh();
      });
    } else {
      let changes = message.changes;

      const hasClientChanges =
        changes.chunkFiles.added.length > 0 ||
        changes.chunkIds.added.length > 0 ||
        changes.cssFiles.added.length > 0;

      const hasRSCChanges = changes.rscFiles.added.length > 0;

      if (hasClientChanges) {
        // add new css
        let cssFiles = changes.cssFiles.added.map(addCSSFile);

        // reload js modules
        let chunkModules = changes.chunkFiles.added.map(reloadChunkFile);

        // reload client components
        let clientModules = changes.chunkIds.added.map(reloadClientComponent);

        await Promise.all([...cssFiles, ...chunkModules, ...clientModules]);

        startTransition(async () => {
          if (hasRSCChanges) {
            // refresh the rsc
            refresh();
          }

          // remove old css
          setCSSToCleanup((c) => [...c, ...changes.cssFiles.removed]);

          // refresh react
          await window.$RefreshRuntime$.performReactRefresh();
        });
      } else {
        // some other change, like a non-frontent file (env, etc)
        refresh();
      }
    }
  });

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

    if (link) {
      let href = link.getAttribute("href");
      if (href && href === hrefToRemove) {
        link.disabled = true;
        link.parentNode?.removeChild(link);
      }
    }
  }
}

function addCSSFile(href: string) {
  return new Promise<void>((resolve, reject) => {
    let link = document.createElement("link");
    let head = document.getElementsByTagName("head")[0];

    if (head) {
      link.href = `${cssBase}${href}`;
      link.onload = () => {
        resolve();
      };
      link.onerror = reject;
      link.rel = "stylesheet";

      head.appendChild(link);
    } else {
      reject(new Error("No <head> element found"));
    }
  });
}
