import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Redirects</h2>
        <ul>
          <li>
            <Link
              href="/routing/redirects/page-redirect"
              className="text-blue-500 underline"
            >
              Page calls redirect
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/permanent-redirect"
              className="text-blue-500 underline"
            >
              Permanent redirect
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/redirect-to-another-domain"
              className="text-blue-500 underline"
            >
              Redirect to another domain
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/suspended-redirect"
              className="text-blue-500 underline"
            >
              Suspended redirect
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/redirect-not-found"
              className="text-blue-500 underline"
            >
              Redirect to not found
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/middleware-redirect"
              className="text-blue-500 underline"
            >
              Middleware calls redirect
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/action-redirect"
              className="text-blue-500 underline"
            >
              Action calls redirect
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/action-redirect-to-another-domain"
              className="text-blue-500 underline"
            >
              Action redirect to another domain
            </Link>
          </li>
          <li>
            <Link
              href="/routing/redirects/action-redirect-not-found"
              className="text-blue-500 underline"
            >
              Action redirect not found
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
