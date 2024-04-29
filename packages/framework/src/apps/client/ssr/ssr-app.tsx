import "../ext/react-refresh";
import { use, createElement } from "react";
// @ts-ignore
import { renderToReadableStream } from "react-dom/server.browser";
// @ts-ignore
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";
import { RoutingContext } from "../contexts/routing-context";
import { StreamContext } from "../contexts/stream-context";

export function SSRApp({
  path,
  tree,
  rscStreamReader,
}: {
  path: string;
  tree: any;
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
  path: string;
  bootstrapUrl: string;
};

export async function render({
  rscStream,
  path,
  bootstrapUrl,
}: RenderOptions): Promise<ReadableStream<Uint8Array>> {
  let [rscStream1, rscStream2] = rscStream.tee();
  let rscTree = createFromReadableStream(rscStream1);
  let rscStreamReader = rscStream2.getReader();

  // await new Promise((resolve) => setTimeout(resolve, 0));

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      path,
      tree: rscTree,
      rscStreamReader,
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
