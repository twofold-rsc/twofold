import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function DocsLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: ReactNode;
}) {
  return (
    <div className="px-4 gap-x-8 max-w-7xl mx-auto grid grid-cols-4 lg:grid-cols-5 mt-8">
      <div className="">
        <div className="font-bold">Guides</div>
        <ul className="space-y-1 mt-1">
          <li>
            <Link href="/docs/guides/getting-started">Getting Started</Link>
          </li>
          <li>
            <Link href="/docs/guides/pages">Pages</Link>
          </li>
          <li>
            <Link href="/docs/guides/layouts">Layouts</Link>
          </li>
          <li>
            <Link href="/docs/guides/data-fetching">Data fetching</Link>
          </li>
          <li>
            <Link href="/docs/guides/mutations">Mutations</Link>
          </li>
          <li>
            <Link href="/docs/guides/styling">Styling</Link>
          </li>
        </ul>
      </div>

      {children}
    </div>
  );
}
