import "../ext/react-refresh";
import { use, createElement } from "react";
// @ts-ignore
import { renderToReadableStream } from "react-dom/server.edge";
// @ts-ignore
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { RoutingContext } from "../contexts/routing-context";
import { StreamContext } from "../contexts/stream-context";

export function SSRApp({
  path,
  getTree,
  rscStreamReader,
}: {
  path: string;
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
      path={path}
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
  path: string;
  bootstrapUrl: string;
};

export async function render({
  rscStream,
  ssrManifestModuleMap,
  path,
  bootstrapUrl,
}: RenderOptions): Promise<ReadableStream<Uint8Array>> {
  let [rscStream1, rscStream2] = rscStream.tee();

  let tree: Promise<any>;
  function getTree() {
    if (!tree) {
      tree = createFromReadableStream(rscStream1, {
        ssrManifest: {
          // before enabling this we need to write our own client
          // that can load modules
          // moduleMap: ssrManifestModuleMap,
          // moduleLoading: {
          //   prefix: "/_assets/client-app/",
          // },
          moduleMap: null,
          moduleLoading: null,
        },
      });
    }

    return tree;
  }

  let rscStreamReader = rscStream2.getReader();

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      path,
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
            `An unknown error occurred while SSR rendering: ${path}`,
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
