"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

export function FadeIn({ children }: { children: ReactNode }) {
  let [state, setState] = useState("faded");

  useEffect(() => {
    setTimeout(() => {
      setState("showing");
    });
  }, []);

  return (
    <motion.div
      initial="faded"
      animate={state}
      variants={{
        faded: {
          opacity: 0,
        },
        showing: {
          opacity: 1,
        },
      }}
      transition={{
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
