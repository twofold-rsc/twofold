export async function probeFirstChunk<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader();
  const first = await reader.read();

  let firstPending = !first.done;

  return new ReadableStream<T>({
    async pull(controller) {
      try {
        if (firstPending) {
          firstPending = false;
          if (first.value) {
            controller.enqueue(first.value);
          }
          return;
        }

        const next = await reader.read();

        if (next.done) {
          controller.close();
          reader.releaseLock();
        } else {
          controller.enqueue(next.value);
        }
      } catch (error) {
        controller.error(error);
        reader.releaseLock();
      }
    },

    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
