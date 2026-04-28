import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import React, { use } from "react";
import type { ErrorInfo, ReactFormState } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server.edge";
import { injectRSCPayload } from "rsc-html-stream/server";
import type { RscPayload } from "./payload.js";
import {
  RouteStack,
  RouteStackEntry,
} from "../../../client/apps/client/contexts/route-stack-context.js";
import { RoutingContext } from "../../../client/apps/client/contexts/routing-context.js";
import { GlobalErrorBoundary } from "../../../client/components/error-handling/global-error-boundary.js";
import { onClientSideRenderError } from "../error-handling.client.js";
import ErrorPage from "../../../client/components/error-handling/error-page.js";

function SsrApp(props: { url: URL; routeStack: RouteStackEntry[] }) {
  let navigate = () => {
    throw new Error("Cannot call navigate during SSR");
  };

  let replace = () => {
    throw new Error("Cannot call replace during SSR");
  };

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  return (
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
      <RouteStack stack={props.routeStack} />
    </RoutingContext>
  );
}

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  options: {
    url: URL;
    formState?: ReactFormState;
    nonce?: string;
    debugNojs?: boolean;
  },
): Promise<{ stream: ReadableStream<Uint8Array>; status?: number }> {
  const [rscStreamForSsr, rscStreamForBrowserFlightData] = rscStream.tee();

  let payload: Promise<RscPayload> | undefined = undefined;
  function SsrRoot() {
    payload ??= createFromReadableStream(rscStreamForSsr);
    return <SsrApp url={options.url} routeStack={React.use(payload).stack} />;
  }

  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");
  let htmlStream: ReadableStream<Uint8Array>;
  let status: number | undefined;
  try {
    htmlStream = await renderToReadableStream(
      <GlobalErrorBoundary>
        <SsrRoot />
      </GlobalErrorBoundary>,
      {
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
        },
      },
    );
  } catch (e) {
    status = 500;
    htmlStream = await renderToReadableStream(<ErrorPage error={e} />, {
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
    });
  }

  let responseStream: ReadableStream<Uint8Array> = htmlStream;
  if (!options?.debugNojs) {
    responseStream = responseStream.pipeThrough(
      injectRSCPayload(rscStreamForBrowserFlightData, {
        nonce: options?.nonce,
      }),
    );
  }

  return { stream: responseStream, status };
}
