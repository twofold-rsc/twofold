import "../ext/react-refresh";
import "../ext/webpack-loaders";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserApp } from "./browser-app";
import { startTransition, StrictMode } from "react";

declare global {
  interface Window {
    SSRDidError?: boolean;
  }
}

function main() {
  let tree = (
    <StrictMode>
      <BrowserApp />
    </StrictMode>
  );

  if (!window.SSRDidError) {
    startTransition(() => {
      hydrateRoot(document, tree, {
        onCaughtError(error, errorInfo) {
          let isSafeError =
            isRedirectError(error) ||
            isNotFoundError(error) ||
            isUnauthorizedError(error);

          if (!isSafeError && process.env.NODE_ENV !== "production") {
            // Let's redisplay the normal react error message here.
            //
            // This is taken from: https://github.com/facebook/react/blob/65eec428c40d542d4d5a9c1af5c3f406aecf3440/packages/react-reconciler/src/ReactFiberErrorLogger.js#L60

            // let stack = errorInfo.componentStack ?? "";
            let errorBoundaryName = errorInfo.errorBoundary?.constructor.name;

            console.error(
              "%o\n\n%s",
              error,
              errorBoundaryName
                ? `The error was handled by the ${errorBoundaryName} error boundary.`
                : "The error was caught by React",
            );
          }
        },
      });
    });
  } else {
    // we have a bad ssr stream and we dont want to attempt to hydrate anything
    // lets render what we have and let the client app use its error
    // boundaries to catch
    let root = createRoot(document);
    startTransition(() => {
      root.render(tree);
    });
  }
}

if (typeof window !== "undefined") {
  main();
}

function isNotFoundError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest === "TwofoldNotFoundError"
  );
}

function isRedirectError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldRedirectError")
  );
}

function isUnauthorizedError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldUnauthorizedError")
  );
}
