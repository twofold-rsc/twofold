"use client";

import Link from "@twofold/framework/link";
import { useAnimationControls } from "framer-motion";
import { ReactNode, startTransition, use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "@twofold/framework/use-router";

type ExitAnimation = {
  href: string;
  animate: () => Promise<void>;
};

let exits: ExitAnimation[] = [];

function createExitAnimation(href: string, animate: () => Promise<void>) {
  let exit = {
    href,
    animate,
  };
  exits = [...exits, exit];
  return () => {
    exits = exits.filter(
      (exit) => exit.href !== href && exit.animate !== animate,
    );
  };
}

export function GalleryLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  console.log("top...");
  let controls = useAnimationControls();
  let { navigate } = useRouter();
  let [animations, setAnimations] = useState<Promise<void[]>>();

  console.log("rendering");
  console.log(animations);

  if (animations) {
    console.log("waiting...");
    use(animations);
    console.log("done...");
  }

  useEffect(() => {
    let exitAnimation = () => {
      return controls.start({
        opacity: 0,
        transition: {
          duration: 3,
          ease: "easeIn",
        },
      });
    };

    let cleanup = createExitAnimation(href, exitAnimation);

    return () => {
      console.log("running cleanup");
      cleanup();
    };
  }, [href, controls]);

  function float() {
    return controls.start({
      scale: 1.15,
      opacity: 1,
      transition: {
        duration: 5,
        ease: [0.37, 0, 0.63, 1],
      },
    });
  }

  function navigateToGallery() {
    let exitAnimations = exits
      .filter((exit) => exit.href !== href)
      .map((exit) => exit.animate());

    let floatAnimation = float();

    let animations = [...exitAnimations, floatAnimation];

    startTransition(() => {
      // setAnimations(Promise.all(animations));
      setAnimations(floatAnimation);
      // setAnimations(new Promise((r) => {}));
      navigate(href);
      startTransition(async () => {
        setAnimations(new Promise((r) => {}));
      });
    });
  }

  return (
    <motion.div animate={controls} className={className} style={{ zIndex: 0 }}>
      <Link
        href={href}
        className="relative block"
        onClick={(e) => {
          e.preventDefault();
          navigateToGallery();
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}
