"use client";

import { ReactNode } from "react";
import { motion, useAnimationControls } from "framer-motion";

export function FadeOut({ children }: { children: ReactNode }) {
  let controls = useAnimationControls();

  async function start() {
    let x = controls.start({
      opacity: 0,
      transition: {
        duration: 5,
      },
    });

    await x;
    console.log("done");
  }

  return (
    <motion.div animate={controls} className="w-1/3" exit={{ opacity: 0 }}>
      <button onClick={start}>start</button>
      {children}
    </motion.div>
  );
}
