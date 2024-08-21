import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { getGallery, getImageId, images } from "../../../data/images";
import { ImageCard } from "../../components/image-card";
import { notFound } from "@twofold/framework/not-found";
import { collapseTo, expandFrom } from "../../../utils/animation";
import { AnimatePresence } from "../../components/animate-presence";
import { Image } from "../../gallery-link2";

export default function Page({ params }: PageProps<"slug">) {
  let slug = params.slug;
  let gallery = getGallery(slug);

  if (!gallery) {
    notFound();
  }

  // let galleries = Object.keys(images);
  // let galleryIndex = galleries.indexOf(slug);

  let name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // let order = expandFrom(gallery, galleryIndex);
  // let stack = collapseTo(gallery, galleryIndex);

  return (
    <>
      <title>{name}</title>

      <div>
        <h1 className="text-2xl font-bold tracking-tighter">{name}</h1>
        <p className="mt-1 text-gray-900">
          <Link href="/">Back home</Link>
        </p>
      </div>

      <div className="relative mt-12 grid grid-cols-3 gap-10">
        {gallery.map((src) => (
          <div
            className={"aspect-square w-full"}
            style={{
              viewTransitionName: `image-${getImageId(src)}`,
              // @ts-ignore
              viewTransitionClass: "image-stack",
            }}
            key={src}
          >
            <img src={src} className="aspect-square w-full object-cover" />
          </div>
        ))}
      </div>
    </>
  );
}

function delay(src: string, order: string[]): number {
  // return order.indexOf(src) / 15;
  let index = order.indexOf(src);

  if (index === 0) {
    return 0;
  } else {
    let len = order.length;
    let speedUp = len * 6;
    return len / speedUp / index + delay(order[index - 1], order);
  }
}
