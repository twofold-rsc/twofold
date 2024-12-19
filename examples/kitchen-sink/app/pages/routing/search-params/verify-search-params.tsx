"use client";

import { useRouter } from "@twofold/framework/use-router";

export function VerifySearchParams({
  serializedServerSearchParams,
}: {
  serializedServerSearchParams: Record<string, string>;
}) {
  let router = useRouter();
  let serverSearchParams = new URLSearchParams(serializedServerSearchParams);

  if (router.searchParams.toString() !== serverSearchParams.toString()) {
    throw new Error(
      "A render happened where client and server search params do not match",
    );
  }

  return null;
}
