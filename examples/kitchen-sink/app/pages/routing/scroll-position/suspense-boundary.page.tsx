import Link from "@twofold/framework/link";
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Suspense</h1>

      <div className="mt-4 space-y-4">
        <Suspense
          fallback={
            <div className="h-[1000px] bg-gradient-to-b from-yellow-100 to-yellow-500"></div>
          }
        >
          <SlowComponent />
        </Suspense>

        <div>
          <Link href="/routing/scroll-position/html">Go to HTML</Link>
        </div>
      </div>
    </div>
  );
}

async function SlowComponent() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return (
    <div>
      <div className="h-[2000px] bg-gradient-to-b from-green-100 to-green-500"></div>
    </div>
  );
}
