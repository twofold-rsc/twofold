# SSR renderer memory diagnostics

Status: deferred; out of scope for the current load-testing PR.

## Problem

The Kitchen Sink memory endpoint currently calls `process.memoryUsage()` from an
API handler. API handlers run in the main server isolate, while HTML rendering
runs in a Node worker thread owned by the framework.

For worker threads, `rss` describes the entire process, but `heapTotal`,
`heapUsed`, `external`, and `arrayBuffers` describe only the isolate that calls
`process.memoryUsage()`. The current endpoint therefore provides:

- Process-wide RSS, including the server and SSR renderer.
- Main server isolate heap, external memory, and array buffer usage.
- No direct heap, external memory, or array buffer usage for the SSR renderer.

This means an SSR renderer leak can be observed indirectly through RSS growth,
but it cannot be identified as renderer heap or buffer retention.

## Goals

- Allow application-owned diagnostics, such as the Kitchen Sink API endpoint,
  to sample SSR renderer memory.
- Keep `Runtime`, `Worker`, `MessagePort`, and the worker protocol private.
- Describe the public concept as a renderer, not a worker thread, so the
  implementation can change later.
- Report process RSS once and report isolate-specific values separately.
- Make each diagnostics request independent and safe during concurrent renders.
- Avoid automatically exposing an HTTP diagnostics endpoint in applications.

## Non-goals

- Exposing the framework runtime to application code.
- Providing a general-purpose RPC interface to the SSR renderer.
- Continuously publishing worker telemetry.
- Deciding memory leak thresholds for the load tests.
- Providing heap snapshots or allocation profiles.

## Proposed public API

Add a server-only export at `@twofold/framework/diagnostics`:

```ts
import { memoryUsage } from "@twofold/framework/diagnostics";

let memory = await memoryUsage();
```

The result should separate process-wide and isolate-specific measurements:

```ts
export type IsolateMemoryUsage = {
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
};

export type FrameworkMemoryUsage = {
  rss: number;
  server: IsolateMemoryUsage;
  renderer: IsolateMemoryUsage;
};

export function memoryUsage(): Promise<FrameworkMemoryUsage>;
```

`server` is the main server isolate and `renderer` is the isolate responsible
for SSR. The API does not expose that the renderer currently uses one worker
thread.

RSS must appear only once. Calling `process.memoryUsage()` in both threads
returns the same process-wide RSS, so adding those RSS values would double
count memory.

The isolate-specific fields should remain separate. In particular, reporting
renderer `external` and `arrayBuffers` separately is the reason for this API.

## Kitchen Sink usage

The application continues to own the HTTP endpoint and decides whether and how
it should be exposed:

```ts
import { memoryUsage } from "@twofold/framework/diagnostics";

export async function GET() {
  return Response.json(await memoryUsage(), {
    headers: {
      "cache-control": "no-store",
    },
  });
}
```

The load test can then create separate gauges for server and renderer heap,
external memory, and array buffers while retaining one RSS gauge.

The helper should be called inside the request handler, not at module scope.
API modules may be loaded or warmed outside an active request context.

## Public-to-runtime bridge

The framework already uses request-scoped `AsyncLocalStorage` for public
server helpers such as cookies and page context. Diagnostics should follow the
same pattern rather than exposing `Runtime`.

Add a narrow capability to the request store:

```ts
type Store = {
  // Existing fields...
  diagnostics: {
    rendererMemoryUsage(): Promise<NodeJS.MemoryUsage>;
  };
};
```

The request-store middleware has access to the current runtime and can bind the
capability:

```ts
diagnostics: {
  rendererMemoryUsage: () => ctx.runtime.rendererMemoryUsage(),
},
```

The public `memoryUsage()` helper should:

1. Read the diagnostics capability through `getStore()`.
2. Sample main-thread `process.memoryUsage()`.
3. Await `rendererMemoryUsage()`.
4. Return process RSS plus separate server and renderer isolate fields.

This keeps the concrete runtime private and selects the runtime associated with
the current request, which is important when development rebuilds replace a
runtime.

## One-shot renderer RPC

`Runtime.rendererMemoryUsage()` should use a dedicated `MessageChannel` for
each sample. One port remains in the runtime and the other is transferred to
the SSR renderer.

Conceptually:

```ts
async rendererMemoryUsage(): Promise<NodeJS.MemoryUsage> {
  let { port1, port2 } = new MessageChannel();

  // Register response, close, error, and timeout handling before posting.
  this.#ssrWorker.postMessage(
    {
      type: "diagnostics.memoryUsage",
      port: port2,
    },
    [port2],
  );

  return await responseFrom(port1);
}
```

The actual implementation should centralize settlement and cleanup rather than
copying this abbreviated example directly.

A one-shot channel is preferable to correlation IDs sent over `parentPort`:

- Every request has an isolated response path.
- No global pending-request map is needed.
- No request IDs or response demultiplexing are needed.
- Concurrent diagnostics requests cannot consume each other's responses.
- Closing the channel naturally ends the request lifecycle.

The existing render path already transfers a per-render `MessagePort`, so this
uses an established internal pattern.

## Worker protocol

The top-level worker message should become a discriminated union. Rendering
messages currently rely on their implicit shape; adding a `type` makes control
requests explicit and safely extensible.

```ts
type WorkerRequest =
  | {
      type: "render";
      mode: "page";
      data: Record<string, unknown>;
      port: MessagePort;
    }
  | {
      type: "diagnostics.memoryUsage";
      port: MessagePort;
    };
```

For a memory request, the worker calls `process.memoryUsage()`, posts the result
through the transferred port, and closes the port:

```ts
if (request.type === "diagnostics.memoryUsage") {
  request.port.postMessage({
    type: "result",
    value: process.memoryUsage(),
  });
  request.port.close();
  return;
}
```

The renderer should return the raw Node memory result internally. The runtime
or public helper is responsible for omitting its duplicate RSS from the public
shape.

## Reliability requirements

The production implementation should handle more than the successful response
case:

- Check that an SSR worker is available before creating the request.
- Install listeners before transferring the response port.
- Validate the response discriminator and all numeric memory fields.
- Reject if the response port closes before a valid result arrives.
- Reject on message deserialization errors.
- Use a bounded timeout so an unhealthy renderer cannot hang an API request.
- Reject when the runtime stops or the worker exits while a request is pending.
- Close the local port and clear the timeout on every settlement path.
- Ignore late messages after the promise has settled.
- Do not terminate or restart the renderer because a diagnostics request fails.

A timeout around five seconds is a reasonable internal starting point. It
should not initially be part of the public API. Under load, the worker may need
to finish synchronous work before it can process the diagnostics message.

The memory sample is not perfectly atomic: the server measurement and renderer
measurement occur a short time apart. That is acceptable for trend-based load
testing. If exact timing later matters, each isolate can include its own sample
timestamp.

## API naming

Prefer names based on stable responsibilities:

- Public module: `@twofold/framework/diagnostics`
- Public function: `memoryUsage()`
- Internal runtime method: `rendererMemoryUsage()`
- Public result roles: `server` and `renderer`

Avoid public names such as `workerMemoryUsage()` or `getSSRWorker()`. Those
would make the current worker-thread topology part of the application API.

## Verification

Add coverage for these cases when implementing the idea:

- The Kitchen Sink endpoint returns finite numeric fields for RSS, server
  memory, and renderer memory.
- Load-test output reports server and renderer `heapUsed`, `external`, and
  `arrayBuffers` independently.

After implementation, compare full GET and HEAD workloads. GET exercises the
SSR renderer, while HEAD currently cancels the RSC response without invoking
HTML SSR. A difference between their renderer metrics would provide a useful
diagnostic signal.
