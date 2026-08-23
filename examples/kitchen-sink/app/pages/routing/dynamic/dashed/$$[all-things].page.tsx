import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"all-things">) {
  return (
    <div>
      <div>Dashed wildcard route!</div>

      <div className="mt-3">
        <span className="rounded bg-gray-100 px-1.5 py-1 font-mono font-semibold text-black">
          &#123;params[&quot;all-things&quot;]&#125;
        </span>{" "}
        is: {params["all-things"]}
      </div>
    </div>
  );
}
