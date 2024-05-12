"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export function LayoutRoot({ children }: { children: ReactNode }) {
  return (
    <motion.div layout layoutRoot>
      {children}
    </motion.div>
  );
}
