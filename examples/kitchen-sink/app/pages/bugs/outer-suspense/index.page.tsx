import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { Suspense } from "react";
import { Loading } from "./loading";

export default function OuterSuspense({ searchParams }: PageProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Outer Suspense</h1>
      <p className="mt-3">
        An already-rendered suspense boundary crashes when a re-render adds
        suspending children to it. This is an inconsistent race condition that
        started happening in React 19.2. It works in 19.1 and canary (19.3 at
        the time of writing this)
      </p>
      <div className="mt-3">
        <Link
          href="/bugs/outer-suspense?data=true"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          Load data
        </Link>
      </div>

      <Suspense fallback={<Loading />}>
        {searchParams.size > 0 && <SlowComponent />}
      </Suspense>
    </div>
  );
}

async function SlowComponent() {
  // await new Promise((resolve) => setTimeout(resolve, 300));

  return <p>Slow component loaded.</p>;
}
