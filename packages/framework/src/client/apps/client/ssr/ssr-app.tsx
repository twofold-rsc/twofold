import "../ext/react-refresh";
import { use, createElement } from "react";
import { renderToReadableStream } from "react-dom/server.edge";
// @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client.edge'.
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";
import { RoutingContext } from "../contexts/routing-context";
import { StreamContext } from "../contexts/stream-context";
import { Segment, SegmentContext } from "../contexts/segment-context";

export function SSRApp({
  url,
  getSegments,
  rscStreamReader,
}: {
  url: URL;
  getSegments: () => Promise<Segment[]>;
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

  let segmentsPromise = getSegments();
  let [rootSegment, ...segments] = use(segmentsPromise);

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
      <StreamContext reader={rscStreamReader}>
        {rootSegment && (
          <SegmentContext segments={segments}>
            {rootSegment.tree}
          </SegmentContext>
        )}
      </StreamContext>
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

  let segments: Segment[];
  async function getSegments() {
    if (!segments) {
      let payload = await createFromReadableStream(rscStream3, {
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

      segments = payload.segments;
    }

    return segments;
  }

  let rscStreamReader = rscStream4.getReader();

  let url = new URL(urlString);

  let htmlStream = await renderToReadableStream(
    createElement(SSRApp, {
      url,
      rscStreamReader,
      getSegments,
    }),
    {
      bootstrapModules: [bootstrapUrl],
      // @ts-expect-error formState is not in @types/react-dom
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
