import "../ext/react-refresh";
import { use, createElement, Fragment } from "react";
import { renderToReadableStream } from "react-dom/server.edge";
// @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client.edge'.
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { RoutingContext } from "../contexts/routing-context";
import { InlineRSCStream } from "../components/inline-rsc-stream";
import { RouteStackEntry, RouteStack } from "../contexts/route-stack-context";

export function SSRApp({
  url,
  getRouteStack,
  rscStreamReader,
}: {
  url: URL;
  getRouteStack: () => Promise<RouteStackEntry[]>;
  rscStreamReader: ReadableStreamDefaultReader<Uint8Array>;
}) {
  let navigate = () => {
    throw new Error("Cannot call navigate during SSR");
  };

  let replace = () => {
    throw new Error("Cannot call replace during SSR");
  };

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  let notFound = () => {
    throw new Error("Cannot call notFound during SSR");
  };

  let routeStackPromise = getRouteStack();
  let routeStack = use(routeStackPromise);

  return (
    <>
      <RoutingContext
        version={1}
        path={url.pathname}
        mask={undefined}
        searchParams={url.searchParams}
        optimisticPath={url.pathname}
        optimisticSearchParams={url.searchParams}
        isTransitioning={false}
        navigate={navigate}
        replace={replace}
        refresh={refresh}
        notFound={notFound}
      >
        <RouteStack stack={routeStack} />
      </RoutingContext>

      <InlineRSCStream reader={rscStreamReader} />
    </>
  );
}

type RenderOptions = {
  rscStream: ReadableStream<Uint8Array>;
  // ssrManifestModuleMap: Record<string, any>;
  urlString: string;
  bootstrapUrl: string;
};

export async function render({
  rscStream,
  urlString,
  bootstrapUrl,
}: RenderOptions): Promise<ReadableStream<Uint8Array>> {
  let [rscStream1, rscStream2] = rscStream.tee();
  let [rscStream3, rscStream4] = rscStream1.tee(); // formState and route stack
  let [rscStream5, rscStream6] = rscStream2.tee(); // ssr render and error free render

  // right now we cant hydrate a suspense above body tag, so if the rsc stream fails to
  // ssr we need to handle that error here (vs defering to the client). note to future
  // self: once you can suspend+hydrate above body this code can be cleaned up.

  let { formState } = await createFromReadableStream(rscStream3, {
    serverConsumerManifest: {
      moduleMap: null,
      serverModuleMap: null,
      moduleLoading: null,
    },
  });

  let routeStack: RouteStackEntry[];
  async function getRouteStack() {
    if (!routeStack) {
      let payload = await createFromReadableStream(rscStream4, {
        serverConsumerManifest: {
          // client references
          moduleMap: null,
          // this is a map of server references, passing in a map lets you
          // change which module to load the references from
          serverModuleMap: null,
          moduleLoading: null,
          // moduleLoading: {
          //   prefix: "/__tf/assets/",
          // },
        },
      });

      routeStack = payload.stack;
    }

    return routeStack;
  }

  let rscStreamReader = rscStream5.getReader();

  let url = new URL(urlString);

  let htmlStream: ReadableStream;
  try {
    htmlStream = await renderToReadableStream(
      createElement(SSRApp, {
        url,
        rscStreamReader,
        getRouteStack,
      }),
      {
        bootstrapModules: [bootstrapUrl],
        formState,
        onError(err: unknown) {
          if (err instanceof Error && isSafeError(err)) {
            // certain errors we know are safe for client handling
          } else if (err instanceof Error) {
            // do something useful here
            console.error(err);
          } else if (err === null) {
            // think we can ignore this case, happens when stream
            // is cancelled on the react-server side
          } else {
            console.error(
              `An unknown error occurred while SSR rendering: ${url.pathname}`,
            );
          }
        },
      },
    );

    // at this point we can cancel the error stream since we don't need it
    rscStream6.cancel();
  } catch {
    // if this fails we need to send a crash back
    htmlStream = await renderToReadableStream(
      createElement(InlineRSCStream, {
        reader: rscStream6.getReader(),
      }),
      {
        bootstrapModules: [bootstrapUrl],
      },
    );
    // TODO: if this render fails we should throw and let the caller trigger
    // a crash
  }

  return htmlStream;
}

// TODO: unsure if err.message is avilable in prod, safer to use digest

function isSafeError(err: Error) {
  return (
    err.message === "TwofoldNotFoundError" ||
    err.message === "TwofoldUnauthorizedError" ||
    err.message.startsWith("TwofoldRedirectError")
  );
}
