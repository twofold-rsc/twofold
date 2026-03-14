export function readStream<T>(
  stream: ReadableStream<T>,
  controls: {
    onRead: (value: T) => void;
    onDone: () => void;
    onError?: (err: unknown) => void;
  },
) {
  let reader = stream.getReader();
  let state: "reading" | "done" | "cancelled" | "errored" = "reading";
  let cancelled = false;

  let done = (async () => {
    try {
      while (true) {
        let result = await reader.read();

        if (result.done) {
          if (cancelled) {
            state = "cancelled";
          } else {
            state = "done";
            controls.onDone();
          }
          break;
        } else {
          controls.onRead(result.value);
        }
      }
    } catch (err) {
      if (!cancelled) {
        state = "errored";

        if (controls.onError) {
          controls.onError(err);
        } else {
          throw err;
        }
      }
    } finally {
      reader.releaseLock();
    }
  })();

  return {
    done,

    getState: () => state,

    async cancel(reason?: unknown) {
      if (state === "reading" && !cancelled) {
        cancelled = true;
        state = "cancelled";
        await reader.cancel(reason);
      }
    },
  };
}
