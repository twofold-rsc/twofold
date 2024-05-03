import { ReactNode } from "react";
import { DocLink } from "./doc-link";
import { FadeIn } from "./fade-in";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <FadeIn>
      <div className="px-4 gap-x-12 max-w-6xl w-full mx-auto grid grid-cols-5 mt-8">
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

          <div className="font-bold mt-6">Server</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/reference/cookies">Cookies</DocLink>
            </li>
            <li>
              <DocLink href="/docs/reference/redirects">Redirects</DocLink>
            </li>
            <li>
              <DocLink href="/docs/reference/not-found">Not found</DocLink>
            </li>
            <li>
              <DocLink href="/docs/reference/middleware">Middleware</DocLink>
            </li>
          </ul>

          <div className="font-bold mt-6">Components</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/components/link">Link</DocLink>
            </li>
          </ul>

          <div className="font-bold mt-6">Hooks</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/guides/">useRouter</DocLink>
            </li>
          </ul>
        </div>

        {children}
      </div>
    </FadeIn>
  );
}
