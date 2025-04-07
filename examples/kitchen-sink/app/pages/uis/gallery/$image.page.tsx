import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import clsx from "clsx";

export default async function ColorPage({ params }: PageProps<"color">) {
  let color = params.color;

  const items = Array.from({ length: 9 }, (_, i) => `${i + 1}`);

  return (
    <div className="relative mb-32">
      <div className="grid grid-cols-3">
        {items.map((i) => (
          <div className="aspect-[16/10] bg-white" key={i} />
        ))}
      </div>

      {color && (
        <Link
          key={color}
          href="/routing/masking"
          scroll="preserve"
          className="absolute top-1/2 left-1/2 z-30 flex aspect-[16/10] w-1/2 -translate-1/2 items-center justify-center"
        >
          <div className={clsx("size-full", color)} />
        </Link>
      )}
    </div>
  );
}
