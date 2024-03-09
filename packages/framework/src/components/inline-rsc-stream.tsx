"use client";

import { Suspense, useContext } from "react";
import { Context } from "../apps/client/contexts/stream-context";

export default function InlineRSCStream() {
  let reader = useContext(Context);

  if (!reader) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Inline reader={reader} />
    </Suspense>
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

  await new Promise((resolve) => setTimeout(resolve, 0));

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

const TERMINATORS_LOOKUP: Record<string, string> = {
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const TERMINATORS_REGEX = /[\u2028\u2029]/g;

function sanitizer(match: string | number) {
  return TERMINATORS_LOOKUP[match];
}

function sanitize(str: string) {
  return str.replace(TERMINATORS_REGEX, sanitizer);
}
