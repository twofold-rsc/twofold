import "./react-refresh";
import "./browser-loaders";
import { hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";

function main() {
  hydrateRoot(document, <BrowserApp />);
}

main();
