"use client";

import { useRouter } from "@twofold/framework/use-router";

export function ClientPath() {
  let { path } = useRouter();

  return <div>Client path: {path}</div>;
}
