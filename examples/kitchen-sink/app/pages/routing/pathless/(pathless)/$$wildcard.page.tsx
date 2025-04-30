import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"wildcard">) {
  return <div>Wildcard page: {params.wildcard}</div>;
}
