import "../ext/react-refresh";
import { use, createElement } from "react";
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
  let [formStateStream, routeStackStream] = rscStream1.tee(); // formState and route stack
  let [inlineRscStream, inlineRscErrorStream] = rscStream2.tee(); // ssr render and error free render

  // right now we cant hydrate a suspense above body tag, so if the rsc stream fails to
  // ssr we need to handle that error here (vs defering to the client). note to future
  // self: once you can suspend+hydrate above body i think this code can be cleaned up.

  let { formState } = await createFromReadableStream(formStateStream, {
    serverConsumerManifest: {
      moduleMap: null,
      serverModuleMap: null,
      moduleLoading: null,
    },
  });

  let routeStack: RouteStackEntry[];
  async function getRouteStack() {
    if (!routeStack) {
      let payload = await createFromReadableStream(routeStackStream, {
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

  let inlineRscStreamReader = inlineRscStream.getReader();

  let url = new URL(urlString);

  let htmlStream: ReadableStream;
  try {
    htmlStream = await renderToReadableStream(
      createElement(SSRApp, {
        url,
        rscStreamReader: inlineRscStreamReader,
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
    inlineRscErrorStream.cancel();
  } catch (e: unknown) {
    // the ssr stream crashed before it started streaming. we'll create a
    // new ssr stream that renders the client app with the rsc stream inline.
    // the rsc stream most likely has a serialized error and the client app
    // will handle that.
    try {
      htmlStream = await renderToReadableStream(
        createElement(InlineRSCStream, {
          reader: inlineRscErrorStream.getReader(),
        }),
        {
          bootstrapModules: [bootstrapUrl],
          bootstrapScriptContent:
            "if (typeof window !== 'undefined') { window.SSRDidError = true; }",
        },
      );
    } catch (e: unknown) {
      // at this point we just cant we. we've had two streams crash.
      // we'll throw and let the worker communicate an error back to
      // the main process.
      throw new Error("Unable to render", { cause: e });
    }
  }

  return htmlStream;
}

function isSafeError(err: Error & { digest?: string }) {
  return (
    err.digest === "TwofoldNotFoundError" ||
    err.digest === "TwofoldUnauthorizedError" ||
    err.digest?.startsWith("TwofoldRedirectError")
  );
}
