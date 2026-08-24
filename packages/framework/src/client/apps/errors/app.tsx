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

  let error =
    typeof window !== "undefined" && "__error" in window
      ? deserializeError(window.__error)
      : new Error("Unknown error");
  let buildKey =
    typeof document !== "undefined"
      ? (document.documentElement.dataset.buildKey ?? null)
      : null;

  createRoot(root).render(<App error={error} buildKey={buildKey} />);
}

function App({ error, buildKey }: { error: Error; buildKey: string | null }) {
  useEffect(() => {
    let onPopState = () => {
      window.location.reload();
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return <ErrorViewer error={error} buildKey={buildKey} />;
}

main();
