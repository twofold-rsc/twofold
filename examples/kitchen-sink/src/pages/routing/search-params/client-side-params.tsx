"use client";

import { useRouter } from "@twofold/framework/use-router";

export function ClientSideParams() {
  let { searchParams } = useRouter();
  return (
    <div>
      <div className="text-sm text-gray-500">Client side search params</div>
      <div>{searchParams.size > 0 ? searchParams.toString() : "None"}</div>
    </div>
  );
}
