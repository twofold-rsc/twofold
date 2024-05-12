"use client";

import { use } from "react";
import { MotionConfig, motion, useMotionTemplate } from "framer-motion";

let cache = new Map<string, Promise<string>>();

function loadImage(src: string) {
  let promise = cache.get(src);

  if (!promise) {
    promise = new Promise<string>((resolve) => {
      fetch(src)
        .then((response) => response.blob())
        .then((myBlob) => {
          let objectURL = URL.createObjectURL(myBlob);
          resolve(objectURL);
        });
    });

    cache.set(src, promise);
  }

  return promise;
}

function Image({ src, ...props }: any) {
  if (!src) {
    throw new Error("Image requires a src prop");
  }

  let blobSrc = use(loadImage(src));
  return (
    <motion.img layout transition={{ duration: 3 }} {...props} src={blobSrc} />
  );
}

export function ImageCard({
  src,
  rotate,
  delay,
}: {
  src: string;
  rotate: number;
  delay: number;
}) {
  let blobSrc = use(loadImage(src));
  let safeRotate = 360 + rotate;

  return (
    <MotionConfig
      transition={{
        delay,
        // duration: 0.25,
        // delay: delay,
        duration: 5,
        ease: "easeOut",
      }}
    >
      <motion.div
        layout
        layoutId={src}
        style={{
          aspectRatio: "1 / 1",
          borderRadius: 24,
          rotate: safeRotate,
        }}
        className="bg-white"
      >
        <motion.div
          layoutId={`${src}-border`}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderStyle: "solid",
            borderRadius: 20,
            padding: 4,
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <motion.img
            layoutId={`${src}-image`}
            style={{
              borderRadius: 16,
            }}
            src={blobSrc}
            className="aspect-square w-full object-cover"
          />
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
}
