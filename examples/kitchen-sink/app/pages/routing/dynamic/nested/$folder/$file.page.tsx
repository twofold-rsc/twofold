import { PageProps } from "@twofold/framework/types";

export default function FilePage({ params }: PageProps<"folder" | "file">) {
  return (
    <div>
      <div>
        <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
          &#123;params.folder&#125;
        </span>{" "}
        is: {params.folder}
      </div>
      <div>
        <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
          &#123;params.file&#125;
        </span>{" "}
        is: {params.file}
      </div>
    </div>
  );
}
