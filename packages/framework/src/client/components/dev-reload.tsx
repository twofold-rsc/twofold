"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "../hooks/use-router";

declare global {
  interface Window {
    $RefreshRuntime$: {
      performReactRefresh(): void;
    };
  }
}

export default function DevReload() {
  let [cssToCleanup, setCSSToCleanup] = useState<string[]>([]);

  let { refresh } = useRouter();

  useEffect(() => {
    cssToCleanup.forEach((file) => removeCSSFile(file));
  }, [cssToCleanup]);

  useEffect(() => {
    let eventSource = new EventSource("/__dev/reload");

    eventSource.onmessage = async (event) => {
      let reload = JSON.parse(event.data);
      // console.log(reload)

      if (reload.rscFiles.added.length > 0) {
        startTransition(() => {
          refresh();
          setCSSToCleanup(reload.cssFiles.removed);
        });
      } else {
        // add new css
        let cssFiles = reload.cssFiles.added.map(addCSSFile);

        // reload js modules
        let chunkModules = reload.chunkFiles.added.map(reloadChunkFile);

        // reload client components
        let clientModules = reload.chunkIds.added.map(reloadClientComponent);

        await Promise.all([...cssFiles, ...chunkModules, ...clientModules]);

        // remove old css
        reload.cssFiles.removed.forEach(removeCSSFile);

        // refresh react
        window.$RefreshRuntime$.performReactRefresh();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [refresh]);

  return null;
}

function reloadChunkFile(chunkFile: string) {
  return import(`/_assets/client-app/chunks/${chunkFile}?v=${Date.now()}`);
}

function reloadClientComponent(chunkId: string) {
  return window.__twofold__chunk_reload__(chunkId);
}

let cssBase = "/_assets/styles/";

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
    link.onload = () => resolve();
    link.onerror = reject;
    link.rel = "stylesheet";

    head.appendChild(link);
  });
}
