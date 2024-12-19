import { Suspense } from "react";

export default function SuspensePage() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tighter">Suspense</h1>

      <div className="mt-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ComponentThatSuspends />
        </Suspense>
      </div>
    </div>
  );
}

async function ComponentThatSuspends() {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return <div>I finally loaded!</div>;
}
