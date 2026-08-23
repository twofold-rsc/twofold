import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"a-slug">) {
  return <div>Dashed dynamic page: {params["a-slug"]}</div>;
}
