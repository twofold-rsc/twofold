"use client";

import Link from "@twofold/framework/link";
import { useRouter } from "@twofold/framework/use-router";
import { motion, cubicBezier } from "framer-motion";
import { useState } from "react";

export function Home() {
  let rows = 25;
  let cols = 25;

  let grid = new Array(rows).fill(0).map((_, i) => new Array(cols).fill(false));

  let [pageState, setPageState] = useState("idle");

  let { navigate } = useRouter();

  async function goToGuides(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setPageState("fade");
  }

  return (
    <motion.div
      initial="idle"
      animate={pageState}
      onAnimationComplete={() => {
        console.log("animation complete");
        navigate("/docs/guides/getting-started");
      }}
      className="relative grow flex flex-col items-center justify-center"
    >
      <motion.div
        variants={{
          idle: {
            scale: 1,
          },
          fade: {
            scale: 26,
            transition: {
              duration: 1,
              ease: cubicBezier(0.5, 0, 0.75, 0),
            },
          },
        }}
        className="z-0 absolute inset-0 w-full h-full grid grid-cols-[repeat(25,_minmax(0,_1fr))] gap-px bg-gray-100 p-px"
      >
        {grid.map((row, i) =>
          row.map((_, j) => <div key={`${i}_${j}`} className="bg-white"></div>),
        )}
      </motion.div>
      <motion.div
        variants={{
          idle: {
            opacity: 1,
          },
          fade: {
            opacity: 0,
            transition: {
              duration: 1,
            },
          },
        }}
        className="z-10 max-w-7xl px-8 w-full mx-auto"
      >
        <div className="max-w-[800px]">
          <h1 className="text-7xl font-black tracking-tighter">Twofold RSC</h1>
          <p className="mt-1 leading-tight text-gray-600 font-medium tracking-tight text-3xl">
            A framework for building demos and weekend projects with React
            Server Components, Tailwind, and TypeScript.
          </p>
          <div className="mt-6">
            <Link
              href="/docs/guides/getting-started"
              onClick={goToGuides}
              className="inline-flex space-x-2 items-center text-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow font-semibold"
            >
              <span>Get started</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
