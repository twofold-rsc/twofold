import { deserializeError } from "serialize-error";
import { createRoot } from "react-dom/client";
import { ErrorViewer } from "./error-viewer.js";
// @ts-expect-error we dont want to setup a module declaration for this import. esbuild handles it just fine.
import "./app.css";
import { useEffect } from "react";

function main() {
  let root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  createRoot(root).render(<App />);
}

function App() {
  let error =
    typeof window !== "undefined" && "__error" in window
      ? deserializeError(window.__error)
      : new Error("Unknown error");

  useEffect(() => {
    let onPopState = () => {
      window.location.reload();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  });

  return <ErrorViewer error={error} />;
}

main();
