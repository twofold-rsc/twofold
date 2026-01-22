import { unauthorized } from "@twofold/framework/unauthorized";
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Suspense then unauthorized
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          This page loads a component that suspends for 2.5 seconds and then
          calls unauthorized.
        </p>

        <div className="mt-6">
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <UnauthorizedComponent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function UnauthorizedComponent() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  unauthorized();

  return <div>You should not see this!</div>;
}
