import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function Layout({ children }: { children: ReactNode }) {
  return children;
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Not found</h2>
        <ul>
          <li>
            <Link
              href="/http/not-found/missing-page-doesnt-exist"
              className="text-blue-500 underline"
            >
              Page doesn't exist
            </Link>
          </li>
          <li>
            <Link
              href="/http/not-found/page-invokes-not-found"
              className="text-blue-500 underline"
            >
              Page calls notFound
            </Link>
          </li>
          <li>
            <Link
              href="/http/not-found/suspended-not-found"
              className="text-blue-500 underline"
            >
              Suspended notFound
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
