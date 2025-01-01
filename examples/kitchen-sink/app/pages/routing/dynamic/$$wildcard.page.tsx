import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"wildcard">) {
  return (
    <div>
      <div>Wildcard route!</div>

      <div className="mt-3">
        <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
          &#123;params.wildcard&#125;
        </span>{" "}
        is: {params.wildcard}
      </div>
    </div>
  );
}
