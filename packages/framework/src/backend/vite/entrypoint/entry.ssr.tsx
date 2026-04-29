import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import React from "react";
import type { ErrorInfo, ReactFormState } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { RscPayload } from "./payload.js";
import { RouteStack } from "../../../client/apps/client/contexts/route-stack-context.js";
import { RoutingContext } from "../../../client/apps/client/contexts/routing-context.js";
import { onClientSideRenderError } from "../error-handling.client.js";
import ErrorPage from "../../../client/components/error-handling/error-page.js";
import { ProgressBarProvider } from "react-transition-progress";

function SsrApp(props: { url: URL; payload: Promise<RscPayload> }) {
  let navigate = () => {
    throw new Error("Cannot call navigate during SSR");
  };

  let replace = () => {
    throw new Error("Cannot call replace during SSR");
  };

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  let routeStack = React.use(props.payload).stack;

  return (
    <ProgressBarProvider>
      <RoutingContext
        version={1}
        path={props.url.pathname}
        mask={undefined}
        searchParams={props.url.searchParams}
        optimisticPath={props.url.pathname}
        optimisticSearchParams={props.url.searchParams}
        isTransitioning={false}
        navigate={navigate}
        replace={replace}
        refresh={refresh}
      >
        <RouteStack stack={routeStack} />
      </RoutingContext>
    </ProgressBarProvider>
  );
}

type SsrResponse =
  | {
      type: "stream";
      stream: ReadableStream<Uint8Array>;
    }
  | {
      type: "error";
      error: unknown;
    };

export async function renderHtmlOrError(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    url: URL;
    formState?: ReactFormState;
    nonce?: string;
    debugNojs?: boolean;
  },
): Promise<SsrResponse> {
  const [rscStreamForSsr, rscStreamForBrowserFlightData] = rscStream.tee();

  let payload: Promise<RscPayload> | undefined = undefined;
  function SsrRoot() {
    payload ??= createFromReadableStream(rscStreamForSsr);
    return <SsrApp url={options.url} payload={payload} />;
  }

  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");
  let responseStream: ReadableStream<Uint8Array>;
  try {
    responseStream = await renderToReadableStream(<SsrRoot />, {
      bootstrapScriptContent: options?.debugNojs
        ? undefined
        : bootstrapScriptContent,
      nonce: options?.nonce,
      formState: options?.formState,
      onError: (error: unknown, errorInfo: ErrorInfo) => {
        onClientSideRenderError({
          isSsr: true,
          url: options.url,
          error,
          errorInfo,
          type: "recoverable",
        });

        // We must return digest here so that the error thrown by renderToReadableStream will have the digest value necessary for the router to correctly detect special errors.
        if (
          typeof error === "object" &&
          error !== null &&
          "digest" in error &&
          typeof error.digest === "string"
        ) {
          return error.digest;
        } else {
          return undefined;
        }
      },
    });
  } catch (error) {
    return { type: "error", error };
  }

  if (!options?.debugNojs) {
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(rscStreamForBrowserFlightData, {
        nonce: options?.nonce,
      }),
    );
  }

  return { type: "stream", stream: responseStream };
}

export async function renderRecoveryHtml(
  rscStream: ReadableStream<Uint8Array>,
  error: unknown,
  options: {
    url: URL;
    formState?: ReactFormState;
    nonce?: string;
    debugNojs?: boolean;
  },
): Promise<ReadableStream<Uint8Array>> {
  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");
  let responseStream: ReadableStream<Uint8Array> = await renderToReadableStream(
    <ErrorPage error={error} />,
    {
      bootstrapScriptContent:
        process.env.NODE_ENV === "production"
          ? `self.__NO_HYDRATE=1;` +
            (options?.debugNojs ? "" : bootstrapScriptContent)
          : `self.__NO_HYDRATE=2;` +
            (options?.debugNojs
              ? ""
              : `
document.getElementById('ssr-request-hydrate').style.display = '';
document.getElementById('ssr-request-hydrate').addEventListener('click', function() { document.getElementById('ssr-request-hydrate').style.display = 'none'; ${bootstrapScriptContent} });
`),
      nonce: options?.nonce,
    },
  );

  if (!options?.debugNojs) {
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(rscStream, {
        nonce: options?.nonce,
      }),
    );
  }

  return responseStream;
}
