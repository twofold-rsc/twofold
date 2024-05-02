import { ReactNode } from "react";
import { DocLink } from "./doc-link";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 gap-x-8 max-w-7xl mx-auto grid grid-cols-4 lg:grid-cols-5 mt-8">
      <div className="">
        <div className="font-bold">Guides</div>
        <ul className="space-y-1 mt-1">
          <li>
            <DocLink href="/docs/guides/getting-started">
              Getting started
            </DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/pages">Pages</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/layouts">Layouts</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/data-fetching">Data fetching</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/mutations">Mutations</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/interactivity">Interactivity</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/styling">Styling</DocLink>
          </li>
        </ul>
      </div>

      {children}
    </div>
  );
}
