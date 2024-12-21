import { PageProps } from "@twofold/framework/types";

export default function SlugPage({ params }: PageProps<"slug">) {
  return (
    <div>
      <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
        &#123;params.slug&#125;
      </span>{" "}
      is: {params.slug}
    </div>
  );
}
