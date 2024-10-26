import "../ext/react-refresh";
import { use, createElement } from "react";
// @ts-expect-error: Could not find a declaration file for module 'react-dom/server.edge'.
import { renderToReadableStream } from "react-dom/server.edge";
// @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client.edge'.
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { RoutingContext } from "../contexts/routing-context";
import { StreamContext } from "../contexts/stream-context";

export function SSRApp({
  url,
  getTree,
  rscStreamReader,
}: {
  url: URL;
  getTree: () => any;
  rscStreamReader: ReadableStreamDefaultReader<Uint8Array>;
}) {
  let navigate = (path: string) => {
    throw new Error("Cannot call navigate during SSR");
  };

  let replace = (path: string) => {
    throw new Error("Cannot call replace during SSR");
  };

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  let notFound = () => {
    throw new Error("Cannot call notFound during SSR");
  };

  let tree = getTree();

  return (
    <RoutingContext
      path={url.pathname}
      searchParams={url.searchParams}
      optimisticPath={url.pathname}
      optimisticSearchParams={url.searchParams}
      isTransitioning={false}
      navigate={navigate}
      replace={replace}
      refresh={refresh}
      notFound={notFound}
    >
      <StreamContext reader={rscStreamReader}>{use(tree)}</StreamContext>
    </RoutingContext>
  );
}

type RenderOptions = {
  rscStream: ReadableStream<Uint8Array>;
  ssrManifestModuleMap: Record<string, any>;
  urlString: string;
  bootstrapUrl: string;
};

export async function render({
  rscStream,
  ssrManifestModuleMap,
  urlString,
  bootstrapUrl,
}: RenderOptions): Promise<ReadableStream<Uint8Array>> {
  let [rscStream1, rscStream2] = rscStream.tee();

  let tree: Promise<any>;
  function getTree() {
    if (!tree) {
      tree = createFromReadableStream(rscStream1, {
        serverConsumerManifest: {
          moduleMap: null,
          serverModuleMap: null,
          moduleLoading: null,
          // moduleMap: ?? i think this allows lookup from the ssrManifestModuleMap
          // serverModuleMap: ssrManifestModuleMap,
          // moduleLoading: {
          //   prefix: "/_assets/client-app/",
          // },
        },
      });
    }

    return tree;
  }

  let rscStreamReader = rscStream2.getReader();

  let url = new URL(urlString);

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      url,
      rscStreamReader,
      getTree,
    }),
    {
      bootstrapModules: [bootstrapUrl],
      onError(err: unknown) {
        if (err instanceof Error && isSafeError(err)) {
          // certain errors we know are safe for client handling
        } else if (err instanceof Error) {
          // do something useful here
          console.error(err);
        } else {
          console.error(
            `An unknown error occurred while SSR rendering: ${url.pathname}`
          );
        }
      },
    }
  );

  return htmlStream;
}

function isSafeError(err: Error) {
  return (
    err.message === "TwofoldNotFoundError" ||
    err.message.startsWith("TwofoldRedirectError")
  );
}
