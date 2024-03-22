import "../ext/react-refresh";
import "../ext/webpack-loaders";
import { hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
    __twofold?: {
      updateTree?: (path: string, tree: any) => void;
      navigate?: (path: string) => void;
      showTree?: (path: string, tree: any) => void;
    };
  }
}

function main() {
  hydrateRoot(document, <BrowserApp />);
}

main();
