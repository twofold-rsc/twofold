import { Suspense } from "react";
import UseIdCC from "./use-id-cc";

export default function UseIdPage() {
  return (
    <div>
      <UseIdCC />
      <Suspense fallback={<>Loading</>}>
        <DelayedId />
      </Suspense>
    </div>
  );
}

async function DelayedId() {
  await new Promise((r) => setTimeout(r, 1000));
  return <UseIdCC />;
}
