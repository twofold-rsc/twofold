import { PageProps } from "@twofold/framework/types";

export default function Page({ params }: PageProps<"dynamic">) {
  return <div>Dynamic page: {params.dynamic}</div>;
}
