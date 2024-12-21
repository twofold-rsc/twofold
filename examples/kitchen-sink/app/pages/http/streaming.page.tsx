import { Suspense } from "react";

export default function StreamPage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">
        Streaming and Suspense
      </h1>
      <p className="pt-3 text-gray-800">
        This page demos SSR, streaming, and suspense. The h1 and p tags are
        immediately rendered. Then as the slow components render on the server
        their resulting HTML is streamed down to the client.
      </p>

      <div className="mt-4 space-y-4">
        <Suspense fallback={<Loading />}>
          <SlowComponent loadTime={1000} />
        </Suspense>

        <Suspense fallback={<Loading />}>
          <SlowComponent loadTime={2500} />
        </Suspense>

        <Suspense fallback={<Loading />}>
          <SlowComponent loadTime={5000} />
        </Suspense>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <p className="rounded border border-red-100 bg-red-50 p-4 text-red-500">
      Loading...
    </p>
  );
}

async function SlowComponent({ loadTime }: { loadTime: number }) {
  await sleep(loadTime);

  return (
    <p className="rounded border border-green-100 bg-green-50 p-4 text-green-500">
      Slow component loaded after {loadTime}ms.
    </p>
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
