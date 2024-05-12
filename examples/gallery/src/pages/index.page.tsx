import { getGallery, images } from "../data/images";
import { AnimatePresence } from "./components/animate-presence";
import { FadeOut } from "./components/fade-out";
import { ImageCard } from "./components/image-card";
import Link from "@twofold/framework/link";

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
          <FadeOut key={gallery}>
            <Link
              href={`/gallery/${gallery}`}
              className="relative block"
              key={gallery}
            >
              {getGallery(gallery).map((src, imageIndex) => (
                <div
                  className={`
                    absolute inset-0 w-full
                    ${imageIndex === galleryIndex ? "z-0" : "z-10"}
                  `}
                  key={src}
                >
                  <ImageCard
                    src={src}
                    rotate={rotate(imageIndex)}
                    delay={imageIndex / 20}
                  />
                </div>
              ))}
            </Link>
          </FadeOut>
        ))}
      </div>
    </>
  );
}

function rotate(index: number) {
  let dir = index % 2 === 0 ? -1 : 1;
  return ((index + 1) % 4) * 1.15 * dir;
}
