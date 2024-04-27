import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 flex space-x-4">
      <div>
        <ul>
          <li>
            <Link href="/docs/guides/getting-started">Getting Started</Link>
          </li>
        </ul>
        <ul>
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
        </ul>
      </div>

      <div>{children}</div>
    </div>
  );
}
