import {
  renderToReadableStream,
  // @ts-expect-error: TypeScript cannot find type declarations for this module
} from "react-server-dom-webpack/server.edge";
// @ts-expect-error: TypeScript cannot find type declarations for this module
import { createFromReadableStream } from "react-server-dom-webpack/client.edge";

export async function encode(value: any) {
  let serializationError: unknown;

  let rscStream = renderToReadableStream(
    value,
    {},
    {
      onError(err: unknown) {
        serializationError = err;
        console.error(err);
      },
    },
  );

  let decoder = new TextDecoder();
  let text = "";
  for await (let chunk of rscStream) {
    text += decoder.decode(chunk);
  }

  if (serializationError) {
    throw serializationError;
  }

  return text;
}

export async function decode(value: any) {
  let encoder = new TextEncoder();

  let stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(value));
      controller.close();
    },
  });

  return createFromReadableStream(stream, {
    serverConsumerManifest: {
      moduleMap: null,
      serverModuleMap: null,
      moduleLoading: null,
    },
  });
}
