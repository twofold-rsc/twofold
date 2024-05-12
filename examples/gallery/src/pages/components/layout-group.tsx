"use client";

import { LayoutGroup as FMLayoutGroup } from "framer-motion";
import { ReactNode } from "react";

export function LayoutGroup({ children }: { children: ReactNode }) {
  return (
    <FMLayoutGroup>
      <>{children}</>
    </FMLayoutGroup>
  );
}
