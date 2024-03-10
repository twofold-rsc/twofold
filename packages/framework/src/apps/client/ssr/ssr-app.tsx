import "../ext/react-refresh";
import { use, createElement, Component, ReactNode } from "react";
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

  let refresh = () => {
    throw new Error("Cannot call refresh during SSR");
  };

  return (
    <RoutingContext path={path} navigate={navigate} refresh={refresh}>
      <StreamContext reader={rscStreamReader}>{use(tree)}</StreamContext>
    </RoutingContext>
  );
}

type RenderOptions = {
  rscStream: ReadableStream<Uint8Array>;
  path: string;
  bootstrapUrl: string;
};

export async function render({ rscStream, path, bootstrapUrl }: RenderOptions) {
  let [rscStream1, rscStream2] = rscStream.tee();
  let rscTree = createFromReadableStream(rscStream1);
  let rscStreamReader = rscStream2.getReader();

  await new Promise((resolve) => setTimeout(resolve, 0));

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      path,
      tree: rscTree,
      rscStreamReader,
    }),
    {
      bootstrapModules: [bootstrapUrl],
      onError(err: unknown) {
        console.log("ssr renderToReadableStream onError");
        if (err instanceof Error) {
          console.log({
            instanceOfError: true,
            isTwofoldError: "isTwofoldError" in err,
            name: err.name,
          });
        }
        // do something useful here
        // console.log(err);
      },
    },
  );

  return htmlStream;
}
