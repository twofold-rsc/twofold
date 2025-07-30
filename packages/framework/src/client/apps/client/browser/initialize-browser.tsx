import "../ext/react-refresh";
import "../ext/webpack-loaders";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";
import { startTransition, StrictMode } from "react";

function main() {
  // startTransition(() => {
  //   hydrateRoot(
  //     document,
  //     <StrictMode>
  //       <BrowserApp />
  //     </StrictMode>
  //   );
  // });

  const root = createRoot(document);
  root.render(
    <StrictMode>
      <BrowserApp />
    </StrictMode>
  );
}

main();
