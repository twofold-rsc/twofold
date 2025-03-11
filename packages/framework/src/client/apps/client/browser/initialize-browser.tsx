import "../ext/react-refresh";
import "../ext/webpack-loaders";
import { hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";
import { StrictMode } from "react";

function main() {
  hydrateRoot(
    document,
    <StrictMode>
      <BrowserApp />
    </StrictMode>,
  );
}

main();
