"use client";

import { useEffect } from "react";
import { useRouter } from "../hooks/use-router";

declare global {
  interface Window {
    $RefreshRuntime$: {
      performReactRefresh(): void;
    };
  }
}

export default function DevReload() {
  let { refresh } = useRouter();

  useEffect(() => {
    let eventSource = new EventSource("/__dev/reload");

    eventSource.onmessage = async (event) => {
      let reload = JSON.parse(event.data);
      // console.log(reload);

      if (reload.type === "css") {
        refresh();
      } else if (reload.type === "rsc") {
        refresh();
      } else if (reload.type === "chunks") {
        let modules = reload.chunks.map((chunkId: string) =>
          window.$Framework$reloadChunk(chunkId),
        );
        await Promise.all(modules);
        window.$RefreshRuntime$.performReactRefresh();
      } else if (reload.type === "unknown") {
        refresh();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [refresh]);

  return null;
}
