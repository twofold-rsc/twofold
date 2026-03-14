export function createBatchStream(options?: { batchWindow?: number }) {
  let batch: Uint8Array[] = [];
  let timer: NodeJS.Timeout | null = null;
  let batchWindow = options?.batchWindow ?? 2;

  let batchStream = new TransformStream<Uint8Array, Uint8Array[]>({
    transform(chunk, controller) {
      batch.push(chunk);

      if (!timer) {
        timer = setTimeout(() => {
          timer = null;

          if (batch.length) {
            try {
              controller.enqueue(batch);
              batch = [];
            } catch {
              // most likely error/aborted stream
            }
          }
        }, batchWindow);
      }
    },

    flush(controller) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (batch.length) {
        controller.enqueue(batch);
        batch = [];
      }
    },
  });

  return batchStream;
}

export function combineBatch<T extends Uint8Array>(batch: T[]) {
  const length = batch.reduce((a, c) => c.byteLength + a, 0);

  let out = new Uint8Array(length);

  let offset = 0;
  for (let i = 0; i < batch.length; i++) {
    const chunk = batch[i];
    if (chunk) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }

  return out;
}
