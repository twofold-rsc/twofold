import { ReactNode, createContext } from "react";
import { Component, Suspense, useContext } from "react";

export const Context =
  createContext<ReadableStreamDefaultReader<Uint8Array> | null>(null);

export function StreamContext({
  reader,
  children,
}: {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  children: ReactNode;
}) {
  return (
    <Context value={reader}>
      {children}
      <InlineRSCStream />
    </Context>
  );
}

// TEST

export default function InlineRSCStream() {
  let reader = useContext(Context);

  if (!reader) {
    return null;
  }

  return (
    <TeardownOnError>
      <Suspense fallback={null}>
        <Inline reader={reader} />
      </Suspense>
    </TeardownOnError>
  );
}

// From: https://gist.github.com/jacob-ebey/b21d3dbe275befff481ec8f3702f90ae#file-recursive-rsc-stream-inline-ts

async function Inline({
  reader,
  decoder,
  didSetup = false,
}: {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  decoder?: TextDecoder;
  didSetup?: boolean;
}) {
  decoder = decoder || new TextDecoder();

  let { done, value } = await reader.read();
  let string = decoder.decode(value, { stream: true });

  return (
    <>
      <>
        {!didSetup && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  let push;
                  let complete;
                  let stream = new ReadableStream({
                    start(controller) {
                      let encoder = new TextEncoder();
                      push = function(chunk) {
                        controller.enqueue(encoder.encode(chunk));
                      }
                      complete = function() {
                        controller.close();
                      }
                    }
                  });

                  window.initialRSC = {
                    stream: stream,
                    push: push,
                    complete: complete,
                  }
                })();
              `,
            }}
          />
        )}
      </>
      <>
        {done ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.initialRSC.complete();`,
            }}
          />
        ) : (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.initialRSC.push(${sanitize(
                  JSON.stringify(string),
                )});`,
              }}
            />

            <Suspense>
              <Inline reader={reader} decoder={decoder} didSetup={true} />
            </Suspense>
          </>
        )}
      </>
    </>
  );
}

// From https://github.com/cyco130/vite-rsc/blob/2e3d0ad9915e57c4b2eaa3ea24b46c1b477a4cce/packages/fully-react/src/server/htmlescape.ts#L25C1-L38C2

let ESCAPE_LOOKUP: Record<string, string> = {
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

let ESCAPE_REGEX = /[><\u2028\u2029]/g;

function escaper(match: string | number) {
  return ESCAPE_LOOKUP[match] ?? "";
}

function sanitize(str: string) {
  return str.replace(ESCAPE_REGEX, escaper);
}

export class TeardownOnError extends Component<
  { children: ReactNode },
  {
    error: unknown;
    hasError: boolean;
  }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      error: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      error,
      hasError: true,
    };
  }

  render() {
    if (this.state.hasError) {
      return null;
    } else {
      return this.props.children;
    }
  }
}
