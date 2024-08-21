"use client";

import Link from "@twofold/framework/link";
import {
  ReactNode,
  startTransition,
  use,
  createContext,
  useId,
  useState,
} from "react";
import { useRouter } from "@twofold/framework/use-router";
import {
  ViewTransitionsContext,
  useViewTransition,
} from "./providers/animation";
import { getImageId } from "../data/images";

let GalleryLinkContext = createContext<string>("");

export function GalleryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  let { navigate } = useViewTransition();
  let startViewTransition = use(ViewTransitionsContext);

  let [isFannedOut, setIsFannedOut] = useState(false);

  return (
    <Link
      href={href}
      className="group relative block"
      data-fanned-out={isFannedOut ? "true" : undefined}
      onMouseEnter={() => {
        setIsFannedOut(true);
      }}
      onMouseLeave={() => {
        setIsFannedOut(false);
      }}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      style={{
        "--fanned-out": isFannedOut ? 1 : 0,
      }}
    >
      <GalleryLinkContext.Provider value={href}>
        {children}
      </GalleryLinkContext.Provider>
    </Link>
  );
}

export function GalleryLinkImage({
  src,
  index,
}: {
  src: string;
  index: number;
}) {
  let galleryPath = use(GalleryLinkContext);
  let { pendingPath } = useViewTransition();
  let isTransitioningToGallery = pendingPath === galleryPath;
  let id = getImageId(src);

  let indexToRotation = [
    "group-data-[fanned-out=true]:rotate-[-17deg] group-data-[fanned-out=true]:translate-x-[-20%] group-data-[fanned-out=true]:translate-y1-[-15%]",
    "group-data-[fanned-out=true]:rotate-[12deg] group-data-[fanned-out=true]:translate-x-[20%] group-data-[fanned-out=true]:translate-y1-[-15%]",
    "group-data-[fanned-out=true]:rotate-[-12deg] group-data-[fanned-out=true]:translate-x-[-17%] group-data-[fanned-out=true]:translate-y1-[-8%]",
    "group-data-[fanned-out=true]:rotate-[7deg] group-data-[fanned-out=true]:translate-x-[12%] group-data-[fanned-out=true]:translate-y1-[-7%]",
    "group-data-[fanned-out=true]:rotate-[-3deg]",
    "group-data-[fanned-out=true]:scale-[1.05]",
  ];

  return (
    <div
      className={`
        absolute inset-0 aspect-square w-full
        transition-transform
        group-data-[fanned-out=true]:z-10
        ${indexToRotation[index]}
      `}
      style={{
        // zIndex: index,
        zIndex: isTransitioningToGallery ? index : undefined,
        viewTransitionName: `image-${id}`,

        // viewTransitionName: isTransitioningToGallery
        //   ? `image-stack-${index}`
        //   : `image-${id}`,
        // @ts-ignore
        viewTransitionClass: isTransitioningToGallery
          ? `image-stack`
          : "image-card",
      }}
    >
      <img src={src} className="aspect-square w-full object-cover" />
    </div>
  );
}

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

export function Image({ src, ...props }: any) {
  if (!src) {
    throw new Error("Image requires a src prop");
  }

  let blobSrc = use(loadImage(src));

  return <img {...props} src={blobSrc} />;
}
