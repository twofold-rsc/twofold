export async function probeFirstChunk<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader();
  let first: ReadableStreamReadResult<T>;

  try {
    first = await reader.read();
  } catch (error) {
    reader.releaseLock();
    throw error;
  }

  if (first.done) {
    reader.releaseLock();
    return new ReadableStream<T>({
      start(controller) {
        controller.close();
      },
    });
  }

  let firstPending = !first.done;

  return new ReadableStream<T>({
    async pull(controller) {
      try {
        if (firstPending) {
          firstPending = false;
          controller.enqueue(first.value);
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
