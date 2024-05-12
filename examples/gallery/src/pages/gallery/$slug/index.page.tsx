import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { getGallery, images } from "../../../data/images";
import { ImageCard } from "../../components/image-card";
import { notFound } from "@twofold/framework/not-found";

export default function Page({ params }: PageProps<"slug">) {
  let slug = params.slug;
  let gallery = getGallery(slug);

  if (!gallery) {
    notFound();
  }

  let galleries = Object.keys(images);
  let galleryIndex = galleries.indexOf(slug);

  let name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let totalImages = gallery.length;

  // z-[0], z-[10], z-[20], z-[30], z-[40], z-[50]

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
        {gallery.map((src, index) => (
          <div
            className={`
              w-full
              z-[${
                index === galleryIndex
                  ? "0"
                  : index > galleryIndex
                    ? `${index}0`
                    : `${galleryIndex - index}0`
              }]
            `}
            key={src}
          >
            <div>
              z-[
              {index === galleryIndex
                ? "0"
                : index > galleryIndex
                  ? `${index}0`
                  : `${galleryIndex - index}0`}
              ]
            </div>
            <div>
              delay:{" "}
              {index === galleryIndex
                ? totalImages - 1
                : index > galleryIndex
                  ? totalImages - 1 - index
                  : index + galleryIndex + 2}
            </div>
            <ImageCard
              src={src}
              rotate={0}
              // delay={(totalImages - (index + 1)) / 20}
              delay={
                index === galleryIndex
                  ? totalImages - 1
                  : index > galleryIndex
                    ? totalImages - 1 - index
                    : index + galleryIndex + 1
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}

// z-index

// galleryIndex=0
// 0 -> 0
// 1 -> 1
// 2 -> 2
// 3 -> 3
// 4 -> 4
// 5 -> 5

// galleryIndex=1
// 0 -> 1
// 1 -> 0
// 2 -> 2
// 3 -> 3
// 4 -> 4
// 5 -> 5

// galleryIndex=2
// 0 -> 2
// 1 -> 1
// 2 -> 0
// 3 -> 3
// 4 -> 4
// 5 -> 5

// delays

// galleryIndex=0
// 5 -> 0
// 4 -> 1
// 3 -> 2
// 2 -> 3
// 1 -> 4
// 0 -> 5

// galleryIndex=1
// 5 -> 0
// 4 -> 1
// 3 -> 2
// 2 -> 3
// 1 -> 5
// 0 -> 4

// galleryIndex=2
// 5 -> 0
// 4 -> 1
// 3 -> 2
// 2 -> 5
// 1 -> 4
// 0 -> 3
