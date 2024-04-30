import Link from "@twofold/framework/link";
import { Guide, getHeadingsFromSlug, getTitleFromSlug } from "../docs";

export default async function GuidesPage({
  params,
}: {
  params: { slug: string };
}) {
  let slug = params.slug;
  let title = await getTitleFromSlug(slug);
  let headings = await getHeadingsFromSlug(slug);

  console.log("headings", headings);

  return (
    <>
      <title>{title}</title>
      <div className="col-span-3 min-w-0">
        <div>
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-gray-500">Docs</span>
            <span className="text-gray-400 text-xs">/</span>
            <span className="text-gray-500">Guides</span>
            <span className="text-gray-400 text-xs">/</span>
            <Link
              href={`/docs/guides/${slug}`}
              className="text-blue-500 hover:underline active:text-blue-600"
            >
              {title}
            </Link>
          </div>
          <div className="prose prose-h1:mb-4 mt-8 first-of-type:prose-p:mt-0">
            <Guide slug={slug} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="sticky">
          <div className="text-gray-500 text-sm font-semibold">
            On this page
          </div>
          <ul className="space-y-1 mt-1">
            {headings.map((heading) => (
              <li key={heading.title}>{heading.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
