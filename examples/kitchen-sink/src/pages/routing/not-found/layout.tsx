import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Not found</h2>
        <ul>
          <li>
            <Link
              href="/routing/not-found/missing-page-doesnt-exist"
              className="text-blue-500 underline"
            >
              Page doesn't exist
            </Link>
          </li>
          <li>
            <Link
              href="/routing/not-found/page-calls-not-found"
              className="text-blue-500 underline"
            >
              Page calls notFound
            </Link>
          </li>
          <li>
            <Link
              href="/routing/not-found/async-page-calls-not-found"
              className="text-blue-500 underline"
            >
              Async page calls notFound
            </Link>
          </li>

          <li>
            <Link
              href="/routing/not-found/delayed-not-found"
              className="text-blue-500 underline"
            >
              Delayed notFound
            </Link>
          </li>
          <li>
            <Link
              href="/routing/not-found/suspended-not-found"
              className="text-blue-500 underline"
            >
              Suspended notFound
            </Link>
          </li>
          <li>
            <Link
              href="/routing/not-found/middleware-calls-not-found"
              className="text-blue-500 underline"
            >
              Middleware calls notFound
            </Link>
          </li>
          <li>
            <Link
              href="/routing/not-found/action-calls-not-found"
              className="text-blue-500 underline"
            >
              Action calls notFound
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
