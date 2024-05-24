"use client";

import {
  AnimatePresenceProps,
  AnimatePresence as FMAnimatePresence,
} from "framer-motion";
import { ReactNode } from "react";

export function AnimatePresence({
  children,
  ...props
}: AnimatePresenceProps & { children: ReactNode }) {
  return (
    <FMAnimatePresence {...props}>
      <>{children}</>
    </FMAnimatePresence>
  );
}
