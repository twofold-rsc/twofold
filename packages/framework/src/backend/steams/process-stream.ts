import { ReadableStreamReadResult } from "node:stream/web";

export function readStream<T>(
  stream: ReadableStream<T>,
  controls: {
    onRead: (value: T) => void;
    onDone: () => void;
  },
) {
  let reader = stream.getReader();
  function process({ done, value }: ReadableStreamReadResult<T>) {
    if (value) {
      controls.onRead(value);
    }
    if (done) {
      controls.onDone();
    } else {
      reader.read().then(process);
    }
  }
  reader.read().then(process);
}
