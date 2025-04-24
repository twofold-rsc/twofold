"use client";

import { use } from "react";

export function Demo1Client({ promise }: { promise: Promise<string> }) {
  const message = use(promise);

  return <div className="text-gray-900">{message}</div>;
}
