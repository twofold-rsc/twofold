import Link from "@twofold/framework/link";
import { LayoutProps } from "@twofold/framework/types";

export default function SlugLayout({ params, children, request }: LayoutProps) {
  let slug = params.slug;

  let url = new URL(request.url);
  console.log(url);

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Dynamic URLs</h1>
      <div className="mt-4 flex space-x-20">
        <ul className="list-disc pl-4">
          <li>
            <Link
              href="/routing/slugs"
              className={`text-blue-500 ${!slug ? "underline" : ""}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/routing/slugs/ABC"
              className={`text-blue-500 ${slug === "ABC" ? "underline" : ""}`}
            >
              Slug ABC
            </Link>
          </li>
          <li>
            <Link
              href="/routing/slugs/123"
              className={`text-blue-500 ${slug === "123" ? "underline" : ""}`}
            >
              Slug 123
            </Link>
          </li>
          <li>
            <Link
              href="/routing/slugs/fixed"
              className={`text-blue-500 ${slug === "123" ? "underline" : ""}`}
            >
              Fixed sibling
            </Link>
          </li>
        </ul>
        <div>{children}</div>
      </div>
    </div>
  );
}
