import "../ext/react-refresh";
import "../ext/webpack-loaders";
import { hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";
import { startTransition, StrictMode } from "react";

function main() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <BrowserApp />
      </StrictMode>,
    );
  });
}

if (typeof window !== "undefined") {
  main();
}
