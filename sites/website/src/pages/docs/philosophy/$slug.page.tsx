import { PageProps } from "@twofold/framework/types";
import { DocPage } from "../doc-page";

export default async function GuidesPage({ params }: PageProps<"slug">) {
  let slug = params.slug;
  return <DocPage type="philosophy" slug={slug} />;
}
