import { probeFirstChunk } from "../../../src/backend/steams/probe-stream.ts";
import { expect, test } from "vitest";

test("releases the source lock when the first read fails", async () => {
  let source = new ReadableStream<string>({
    start(controller) {
      controller.error(new Error("first read failed"));
    },
  });

  await expect(probeFirstChunk(source)).rejects.toThrow("first read failed");
  expect(source.locked).toBe(false);
});

test("releases an already-complete source", async () => {
  let source = new ReadableStream<string>({
    start(controller) {
      controller.close();
    },
  });

  let stream = await probeFirstChunk(source);

  expect(source.locked).toBe(false);
  await expect(stream.getReader().read()).resolves.toEqual({
    done: true,
    value: undefined,
  });
});

test("preserves a falsy first chunk", async () => {
  let source = new ReadableStream<number>({
    start(controller) {
      controller.enqueue(0);
      controller.close();
    },
  });

  let stream = await probeFirstChunk(source);
  let reader = stream.getReader();

  await expect(reader.read()).resolves.toEqual({ done: false, value: 0 });
  await expect(reader.read()).resolves.toEqual({
    done: true,
    value: undefined,
  });
});

test("cancels and unlocks the source when the wrapper is cancelled", async () => {
  let cancelReason: unknown;
  let source = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("first");
    },
    cancel(reason) {
      cancelReason = reason;
    },
  });
  let reason = new Error("wrapper cancelled");

  let stream = await probeFirstChunk(source);
  await stream.cancel(reason);

  expect(cancelReason).toBe(reason);
  expect(source.locked).toBe(false);
});
