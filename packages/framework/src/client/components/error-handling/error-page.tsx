import { ReactNode, useCallback, useState } from "react";
import errorPageStyles from "./error-page.css?inline";
import * as stackTraceParser from "stacktrace-parser";
import { type StackFrame as InternalStackFrame } from "stacktrace-parser";

interface ErrorPageProps {
  error: unknown;
}

function StackFrame(props: { file: ReactNode; frame: InternalStackFrame }) {
  return (
    <>
      <tr className="frame-function">
        <td colSpan={3}>
          {props.frame.methodName}
          {props.frame.arguments.join(", ")}
        </td>
      </tr>
      <tr className="frame-source">
        <td>{props.file}</td>
        <td>{props.frame.lineNumber}</td>
        <td>{props.frame.column}</td>
      </tr>
    </>
  );
}

function InternalFrames(props: { count: number }) {
  return (
    <tr className="frame-internal">
      <td colSpan={3}>
        {props.count} internal frame{props.count === 1 ? "" : "s"}
      </td>
    </tr>
  );
}

function StackTrace(props: { stack: string }) {
  const stack = stackTraceParser.parse(props.stack);

  const rows = [];
  let internalFrames = 0;
  for (let i = 0; i < stack.length; i++) {
    const frame = stack[i];
    if (frame === undefined) {
      continue;
    }
    let file = frame?.file;
    if (file !== undefined && file !== null) {
      let hasDecoded = false;
      if (file.includes("about://React/Server/")) {
        if (file.includes("@")) {
          if (frame.methodName === "<unknown>") {
            frame.methodName = file.substring(0, file.indexOf("@"));
          }
          file = file.substring(file.indexOf("@") + 1);
        }
        file = decodeURI(file.substring("about://React/Server/".length));
        hasDecoded = true;
      }
      if (typeof window !== "undefined") {
        let baseUrl =
          window.location.protocol + "//" + window.location.host + "/@fs/";
        if (file.startsWith(baseUrl)) {
          file = decodeURI(file.substring(baseUrl.length));
          hasDecoded = true;
        }
      }
      let lastQuestion = file.lastIndexOf("?");
      if (lastQuestion !== -1) {
        file = file.substring(0, lastQuestion);
      }
      if (!hasDecoded && file.includes("%")) {
        file = decodeURI(file);
      }
      file = file.replaceAll("\\", "/");
      if (
        file.includes("/node_modules/") ||
        file.startsWith("node:internal/process/task_queues")
      ) {
        internalFrames++;
        continue;
      }
    }
    let fileElement: ReactNode = file;
    if (file !== undefined && file !== null) {
      if (
        file.startsWith("/") ||
        (file.length > 3 && file[1] === ":" && file[2] === "/")
      ) {
        let lineAndColumn = "";
        if (
          frame.lineNumber !== undefined &&
          frame.lineNumber !== null &&
          frame.column !== undefined &&
          frame.column !== null
        ) {
          lineAndColumn = `:${frame.lineNumber}:${frame.column}`;
        } else if (
          frame.lineNumber !== undefined &&
          frame.lineNumber !== null
        ) {
          lineAndColumn = `:${frame.lineNumber}:0`;
        }
        fileElement = (
          <a href={`vscode://file/${file}${lineAndColumn}`}>{file}</a>
        );
      }
    }
    if (internalFrames > 0) {
      rows.push(
        <InternalFrames key={`hidden-frames-${i}`} count={internalFrames} />,
      );
      internalFrames = 0;
    }
    rows.push(<StackFrame key={i} file={fileElement} frame={frame} />);
  }
  if (internalFrames > 0) {
    rows.push(
      <InternalFrames key={`hidden-frames-last`} count={internalFrames} />,
    );
    internalFrames = 0;
  }

  return (
    <table className="stack mt-4">
      <tr>
        <th colSpan={3}>Method and Arguments</th>
      </tr>
      <tr>
        <th>File</th>
        <th>Line Number</th>
        <th>Column</th>
      </tr>
      {rows}
    </table>
  );
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
            {error.stack !== undefined ? (
              <StackTrace stack={error.stack} />
            ) : null}
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
        process.env.NODE_ENV === "development" ? "development" : "production"
      }
    >
      <head>
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <style>{errorPageStyles}</style>
      </head>
      <body>
        <div className="bg-red-50 h-full">
          <div className="p-6 max-w-7xl mx-auto h-full">
            <div className="rounded shadow border border-gray-300 p-6 bg-white">
              <div>
                <h1 className="text-3xl font-black text-gray-900">
                  Application error
                </h1>
                {process.env.NODE_ENV === "production" ? (
                  <p className="pt-3">
                    Something went wrong. Try again later if the issue persists.
                  </p>
                ) : (
                  <p className="pt-3">
                    There was an unhandled error. You need to add an appropriate
                    try/catch block or React error boundary to handle this
                    scenario.
                  </p>
                )}
                <p className={`pt-3 ${digest.trim() !== "" ? "" : "hidden"}`}>
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
                  <button
                    className="rounded bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow ml-2"
                    style={{ display: "none" }}
                    id="ssr-request-hydrate"
                  >
                    Hydrate
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
