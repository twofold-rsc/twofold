"use client";

import Link from "@twofold/framework/link";
import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useState } from "react";

export const images = [
  {
    id: 1,
    rows: 2,
    cols: 1,
    small: {
      top: -100,
      left: -75,
      height: "120%",
    },
    large: {
      top: -470,
      left: -170,
      height: "220%",
    },
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/4.jpg",
  },
  {
    id: 2,
    rows: 1,
    cols: 1,
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/2.jpg",
  },
  {
    id: 3,
    rows: 1,
    cols: 1,
    left: 0,
    width: "100%",
    height: "auto",
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/3.jpg",
  },
  {
    id: 4,
    rows: 1,
    cols: 2,
    small: {
      top: -153,
      height: "300%",
    },

    large: {
      top: -153,
      height: "300%",
    },
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/6.jpg",
  },
  {
    id: 5,
    rows: 1,
    cols: 2,
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/5.jpg",
    large: {
      height: "125%",
      left: 0,
      top: 0,
    },
  },
  {
    id: 6,
    rows: 1,
    cols: 1,
    src: "https://twofold.nyc3.cdn.digitaloceanspaces.com/kitchen-sink/1.jpg",
  },
];

export function Grid() {
  let { searchParams } = useOptimisticRoute();
  let idParam = searchParams.get("image");
  let id = idParam ? parseInt(idParam) : undefined;
  let current = id ? images.find((i) => i.id === id) : undefined;
  let previous = usePrevious(current);

  // style={{
  //   zIndex:
  //     image === current ? 20 : image === previous ? 10 : 0,
  // }}

  return (
    <div className="relative mb-32">
      <div className="grid min-h-[800px] w-full grid-cols-3 grid-rows-3 gap-0">
        {images.map((image) => (
          <Link
            as={motion.a}
            layoutId={`${image.id}-link`}
            href={`/uis/gallery${current !== image ? `?image=${image.id}` : ""}`}
            mask={`/uis/gallery${current !== image ? `/${image.id}` : ""}`}
            scroll="preserve"
            className="block"
            style={{
              gridRow: `span ${image.rows}`,
              gridColumn: `span ${image.cols}`,
              zIndex: image === current ? 20 : image === previous ? 10 : 0,
            }}
            key={image.id}
          >
            <motion.div
              layoutId={`${image.id}-container`}
              style={{
                borderRadius: 0,
              }}
              className="relative h-full w-full overflow-hidden"
            >
              <motion.img
                layoutId={`${image.id}-image`}
                src={image.src}
                className="absolute max-w-none"
                style={{
                  top: image.small?.top,
                  left: image.small?.left,
                  width: image.small?.width,
                  height: image.small?.height,
                }}
              />
            </motion.div>
          </Link>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <Link
            as={motion.a}
            layoutId={`${current.id}-link`}
            key={current.id}
            href="/uis/gallery"
            scroll="preserve"
            className="absolute top-1/2 left-1/2 flex w-2/3 -translate-1/2 flex-col items-center justify-center"
          >
            <motion.div
              layoutId={`${current.id}-container`}
              className="relative h-[550px] w-full overflow-hidden"
              style={{
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <motion.img
                layoutId={`${current.id}-image`}
                src={current.src}
                className="absolute max-w-none"
                style={{
                  top: current.large?.top,
                  left: current.large?.left,
                  width: current.large?.width,
                  height: current.large?.height,
                }}
              />
            </motion.div>

            <motion.div
              // initial={{ opacity: 0 }}
              // animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              className="w-full bg-black p-4 text-sm text-white"
              style={{
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <p>Hello</p>
              <p>Hello</p>
            </motion.div>
          </Link>
        )}
      </AnimatePresence>
    </div>
  );
}

export function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState<T | undefined>(value);
  const [previous, setPrevious] = useState<T | undefined>(undefined);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}
