import { notFound } from "@twofold/framework/not-found";
import { redirect } from "@twofold/framework/redirect";
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">
        Suspense then redirect
      </h1>
      <div className="mt-3">
        <p className="max-w-prose">
          This page loads a component that suspends for 2.5 seconds and then
          triggers a redirect.
        </p>

        <div className="mt-6">
          <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
            <RedirectComponent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RedirectComponent() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  redirect("/routing/redirects/ending");

  return <div>You should not see this!</div>;
}
