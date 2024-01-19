import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function SlugLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: ReactNode;
}) {
  let slug = params.slug;

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
        </ul>
        <div>{children}</div>
      </div>
    </div>
  );
}
