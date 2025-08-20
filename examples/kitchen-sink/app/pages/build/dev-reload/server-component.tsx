import { Suspense } from "react";

export default async function ServerComponent() {
  return (
    <div>
      <div className="-mb-0.5 inline-flex rounded-t bg-purple-500 px-2 py-1 text-white">
        Server component
      </div>
      <div className="rounded border-2 border-dashed border-purple-500 p-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ServerComponentTime />
        </Suspense>
      </div>
    </div>
  );
}

async function ServerComponentTime() {
  // await new Promise((resolve) => setTimeout(resolve, 300));

  return (
    <div>
      <p className="text-gray-900">
        This page is a server component and editing it causes the RSC to
        re-render.
      </p>
      <p className="mt-3 text-gray-900">
        The current time is{" "}
        <span className="bg-purple-500 text-sm text-white">
          {new Date().toISOString()}
        </span>
      </p>
    </div>
  );
}
