import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Optimistic Route</h2>
        <ul>
          <li>
            <Link
              href="/routing/use-optimistic-route/slow-page-start"
              className="text-blue-500 underline"
            >
              Slow start
            </Link>
          </li>
          <li>
            <Link
              href="/routing/use-optimistic-route/slow-action"
              className="text-blue-500 underline"
            >
              Slow action
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
