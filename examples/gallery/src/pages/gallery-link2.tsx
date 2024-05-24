"use client";

import Link from "@twofold/framework/link";
import { ReactNode, startTransition, use, createContext, useId } from "react";
import { useRouter } from "@twofold/framework/use-router";
import {
  ViewTransitionsContext,
  useViewTransition,
} from "./providers/animation";

let GalleryLinkContext = createContext<string>("");

export function GalleryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  // let { navigate } = useRouter();
  // let startViewTransition = use(ViewTransitionsContext);
  let { navigate } = useViewTransition();

  function navigateToGallery() {
    navigate(href);
    // put the href in the store
    // startViewTransition(() => {
    //   navigate(href);
    // });
  }

  return (
    <Link
      href={href}
      className="relative block"
      onClick={(e) => {
        e.preventDefault();
        navigateToGallery();
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
  let isUsingViewTransition = pendingPath === galleryPath;
  let id = useId().replace(/[^a-z0-9]/gi, "");

  return (
    <div
      className="absolute inset-0 aspect-square w-full"
      style={{
        // zIndex: index,
        zIndex: isUsingViewTransition ? index : 0,
        viewTransitionName: isUsingViewTransition
          ? `image-stack-${index}`
          : `image-${id}-homepage`,
        // @ts-ignore
        viewTransitionClass: isUsingViewTransition
          ? "image-stack"
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
