"use client";

import { useRouter } from "@twofold/framework/use-router";

export function ClientSideParams() {
  let { searchParams } = useRouter();
  return (
    <div>
      <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
        &#123;useRouter.searchParams&#125;
      </span>{" "}
      is: {searchParams.toString()}
    </div>
  );
}
