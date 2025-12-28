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
      {
        onCaughtError(error, errorInfo) {
          let isSafeError =
            isRedirectError(error) ||
            isNotFoundError(error) ||
            isUnauthorizedError(error);

          if (!isSafeError && process.env.NODE_ENV !== "production") {
            // I want to redisplay the normal react error message here.
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
      },
    );
  });
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
