import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"dynamic">) {
  return <div>Subroute dynamic page: {params.dynamic}</div>;
}
