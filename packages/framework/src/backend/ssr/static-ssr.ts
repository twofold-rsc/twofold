import { RenderRequest } from "./worker";
import { renderToStaticMarkup } from "react-dom/server";
// @ts-ignore
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";

export async function staticSSR(
  request: Extract<RenderRequest, { method: "static" }>,
) {
  let stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let tree = await createFromReadableStream(request.rscStream, {
          ssrManifest: {
            moduleMap: null,
            moduleLoading: null,
          },
        });

        let html = renderToStaticMarkup(tree);
        controller.enqueue(new TextEncoder().encode(html));
      } catch (e) {
        console.error(e);
      }

      controller.close();
    },
  });

  return stream;
}
