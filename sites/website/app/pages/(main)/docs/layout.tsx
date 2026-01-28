import { ReactNode } from "react";
import { DocLink } from "./components/doc-link";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-8 grid w-full max-w-[1190px] grid-cols-5 gap-x-12 px-4 pb-24">
      <div className="hidden sm:block">
        <div className="font-bold">Guides</div>
        <ul className="mt-1 space-y-1">
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
            <DocLink href="/docs/guides/error-handling">Error handling</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/interactivity">Interactivity</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/styling">Styling</DocLink>
          </li>
          <li>
            <DocLink href="/docs/guides/deployment">Deployment</DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Server</div>
        <ul className="mt-1 space-y-1">
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
          <li>
            <DocLink href="/docs/reference/static-assets">
              Static assets
            </DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Patterns</div>
        <ul className="mt-1 space-y-1">
          <li>
            <DocLink href="/docs/reference/flash-messages">
              Flash messages
            </DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Components</div>
        <ul className="mt-1 space-y-1">
          <li>
            <DocLink href="/docs/reference/link">Link</DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Hooks</div>
        <ul className="mt-1 space-y-1">
          <li>
            <DocLink href="/docs/reference/use-router">useRouter</DocLink>
          </li>
          <li>
            <DocLink href="/docs/reference/use-optimistic-route">
              useOptimisticRoute
            </DocLink>
          </li>
          <li>
            <DocLink href="/docs/reference/use-flash">useFlash</DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Configuration</div>
        <ul className="mt-1 space-y-1">
          <li>
            <DocLink href="/docs/reference/application-config">
              Application
            </DocLink>
          </li>
          <li>
            <DocLink href="/docs/reference/environment-variables">
              Environment variables
            </DocLink>
          </li>
        </ul>

        <div className="mt-6 font-bold">Philosophy</div>
        <ul className="mt-1 space-y-1">
          <li>
            <DocLink href="/docs/philosophy/dont-use-twofold">
              Don't use Twofold
            </DocLink>
          </li>
        </ul>
      </div>

      {children}
    </div>
  );
}
