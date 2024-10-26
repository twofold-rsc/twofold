import { ReactNode } from "react";
import { DocLink } from "./doc-link";
import { EnterDocsAnimation } from "../contexts/enter-docs";
import Link from "@twofold/framework/link";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <EnterDocsAnimation>
      <header className="flex shadow-sm justify-center space-x-10 items-center border-b border-gray-300 py-4">
        <Link href="/" className="text-gray-500">
          Home
        </Link>
        <Link href="/docs" className="text-black">
          Docs
        </Link>
        <a
          href="https://github.com/twofold-rsc/twofold"
          className="text-gray-500"
        >
          Github
        </a>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 gap-x-12 grid grid-cols-5 mt-8">
        <div className="hidden sm:block">
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
              <DocLink href="/docs/reference/link">Link</DocLink>
            </li>
          </ul>

          <div className="font-bold mt-6">Hooks</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/reference/use-router">useRouter</DocLink>
            </li>
            <li>
              <DocLink href="/docs/reference/use-optimistic-route">
                useOptimisticRoute
              </DocLink>
            </li>
          </ul>

          <div className="font-bold mt-6">Configuration</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/reference/application-config">
                Application
              </DocLink>
            </li>
          </ul>

          <div className="font-bold mt-6">Philosophy</div>
          <ul className="space-y-1 mt-1">
            <li>
              <DocLink href="/docs/philosophy/dont-use-twofold">
                Don't use Twofold
              </DocLink>
            </li>
          </ul>
        </div>

        {children}
      </div>
    </EnterDocsAnimation>
  );
}
