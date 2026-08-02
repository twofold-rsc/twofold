"use client";

import { ReactNode } from "react";

export function Resolved({ children }: { children: ReactNode }) {
  // for testing suspended renders that resolve/commit
  // put this inside a suspense boundary
  //
  // console.log("resolved component rendered");
  //
  // useEffect(() => {
  //   console.log("resolved compnent committed");
  // }, []);

  return children;
}
