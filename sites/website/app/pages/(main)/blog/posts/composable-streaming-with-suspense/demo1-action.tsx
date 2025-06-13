"use server";

import { Suspense } from "react";

export async function getDemo1() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i}>
          <Suspense
            fallback={
              <span className="flex size-8 items-center justify-center rounded border border-amber-200 bg-amber-50">
                ⏳
              </span>
            }
          >
            <SlowCheckmark />
          </Suspense>
        </div>
      ))}
    </div>
  );
}

async function SlowCheckmark() {
  const delay = Math.floor(Math.random() * 2500) + 250;
  await new Promise((resolve) => setTimeout(resolve, delay));
  return (
    <span className="flex size-8 items-center justify-center rounded border border-green-200 bg-green-100">
      ✅
    </span>
  );
}
