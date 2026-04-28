import { useCallback, useState } from "react";
import classes from "./error-page.module.css";

interface ErrorPageProps {
  error: unknown;
}

export default function ErrorPage(props: ErrorPageProps) {
  const error = props.error;
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  let errorStack;
  if (process.env.NODE_ENV === "development") {
    errorStack = (
      <div className="mt-4">
        <h2 className="text-2xl font-black text-gray-900">Error details</h2>
        {error instanceof Error ? (
          <>
            <p className="text-red-500 pt-3">{error.message}</p>
            <pre className="mt-3 overflow-x-scroll text-sm">{error.stack}</pre>
          </>
        ) : (
          <>
            <p className="text-red-500 pt-3">Unknown error</p>
            <pre className="mt-3 overflow-x-scroll text-sm">
              {JSON.stringify(error)}
            </pre>
          </>
        )}
      </div>
    );
  }

  const [refreshing, setRefreshing] = useState(false);
  const refreshPage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setRefreshing(true);
      window.location.reload();
    },
    [setRefreshing],
  );

  return (
    <html
      className={
        process.env.NODE_ENV === "development"
          ? classes.development
          : classes.production
      }
    >
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
      </head>
      <body>
        <div className="bg-red-50 h-full">
          <div className="p-6 max-w-7xl mx-auto h-full">
            <div className="rounded shadow border border-gray-300 p-6 bg-white">
              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  Application error
                </h1>
                <p className="pt-3">
                  Something went wrong. Try again later if the issue persists.
                </p>
                <p className={`pt-3 ${digest ? "" : classes.hidden}`}>
                  Digest: {digest}
                </p>
                <div className="pt-4">
                  <button
                    className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow"
                    onClick={refreshPage}
                    disabled={refreshing}
                  >
                    Reload page
                  </button>
                </div>
              </div>
              {errorStack}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
