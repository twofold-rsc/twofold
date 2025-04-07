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
  let [rscStream3, rscStream4] = rscStream1.tee();

  let { formState } = await createFromReadableStream(rscStream2, {
    serverConsumerManifest: {
      moduleMap: null,
      serverModuleMap: null,
      moduleLoading: null,
    },
  });

  let tree: Promise<any>;
  async function getTree() {
    if (!tree) {
      let payload = await createFromReadableStream(rscStream3, {
        serverConsumerManifest: {
          // client references
          moduleMap: null,
          // this is a map of server references, passing in a map lets you
          // change which module to load the references from
          serverModuleMap: null,
          moduleLoading: null,
          // moduleLoading: {
          //   prefix: "/_assets/client-app/",
          // },
        },
      });

      tree = payload.tree;
    }

    return tree;
  }

  let rscStreamReader = rscStream4.getReader();

  let url = new URL(urlString);

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      url,
      rscStreamReader,
      getTree,
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

  return htmlStream;
}

function isSafeError(err: Error) {
  return (
    err.message === "TwofoldNotFoundError" ||
    err.message.startsWith("TwofoldRedirectError")
  );
}
