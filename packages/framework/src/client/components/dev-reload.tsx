"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "../hooks/use-router";

declare global {
  interface Window {
    $RefreshRuntime$: {
      performReactRefresh(): Promise<void>;
    };
  }
}

export default function DevReload() {
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

    eventSource.onmessage = async (event) => {
      let reload = JSON.parse(event.data);

      if (Object.keys(reload).length === 0) {
        // some sort of error state
        refresh();
      } else if (reload.rscFiles.added.length > 0) {
        startTransition(async () => {
          refresh();
          setCSSToCleanup((c) => [...c, ...reload.cssFiles.removed]);

          // if any of the added files had previous been removed, then we
          // have to manually add them back. reason being react still
          // thinks they are rendered, and will not automatically re-insert
          // them.
          let addingCSS = reload.cssFiles.added.map((cssFile: string) =>
            addCSSFile(cssFile)
          );

          await Promise.all(addingCSS);
        });
      } else {
        // add new css
        let cssFiles = reload.cssFiles.added.map(addCSSFile);

        // reload js modules
        let chunkModules = reload.chunkFiles.added.map(reloadChunkFile);

        // reload client components
        let clientModules = reload.chunkIds.added.map(reloadClientComponent);

        await Promise.all([...cssFiles, ...chunkModules, ...clientModules]);

        startTransition(async () => {
          // refresh react
          await window.$RefreshRuntime$.performReactRefresh();

          // remove old css
          setCSSToCleanup((c) => [...c, ...reload.cssFiles.removed]);
        });
      }
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
