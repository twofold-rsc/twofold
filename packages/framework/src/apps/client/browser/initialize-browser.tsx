import "../ext/react-refresh";
import "./browser-loaders";
import { hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";
import { callServer } from "../actions/call-server";

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
    __twofold?: {
      callServer?: typeof callServer;
      updateTree?: (path: string, tree: any) => void;
    };
  }
}

function main() {
  hydrateRoot(document, <BrowserApp />);
}

main();
