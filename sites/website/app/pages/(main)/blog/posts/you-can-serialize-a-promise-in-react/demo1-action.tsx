"use server";

import { Suspense } from "react";
import { Demo1Client } from "./demo1-client";

export function getDemo1() {
  const promise = new Promise<string>((resolve) => {
    setTimeout(() => resolve("Hello from the server!"), 2_000);
  });

  return (
    <Suspense
      fallback={
        <div className="text-gray-500">
          Waiting for ClientComponent to read the promise
        </div>
      }
    >
      <Demo1Client promise={promise} />
    </Suspense>
  );
}
