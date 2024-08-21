import { getGallery, images } from "../data/images";
import { collapseTo } from "../utils/animation";
import { FadeOut } from "./components/fade-out";
import { ImageCard } from "./components/image-card";
import Link from "@twofold/framework/link";
import { GalleryLinkImage, GalleryLink } from "./gallery-link2";
import { AnimatePresence } from "./components/animate-presence";

export default async function Page() {
  let galleries = Object.keys(images);

  return (
    <>
      <title>Suspense image gallery</title>

      <div>
        <h1 className="text-2xl font-bold tracking-tighter">Image gallery</h1>
        <p className="mt-1 text-gray-900">
          A gallery that loads large images with suspense.
        </p>
      </div>

      <div className="mt-12 flex p-12">
        {galleries.map((gallery, galleryIndex) => (
          <div className="w-1/3" key={gallery}>
            <GalleryLink href={`/gallery/${gallery}`}>
              <Stack gallery={getGallery(gallery)} index={galleryIndex} />
            </GalleryLink>
          </div>
        ))}
      </div>
    </>
  );
}

function Stack({ gallery, index }: { gallery: string[]; index: number }) {
  let stack = collapseTo(gallery, index);

  return (
    <>
      {gallery.map((src) => (
        <GalleryLinkImage src={src} index={stack.indexOf(src)} key={src} />
      ))}
    </>
  );
}

function rotate(index: number) {
  let dir = index % 2 === 0 ? -1 : 1;
  return ((index + 1) % 4) * 1.15 * dir;
}
