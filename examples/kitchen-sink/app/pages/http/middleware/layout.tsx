import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Middleware</h2>
        <ul>
          <li>
            <Link href="/http/middleware" className="text-blue-500 underline">
              Middleware
            </Link>
          </li>
          <li>
            <Link
              href="/http/middleware/global"
              className="text-blue-500 underline"
            >
              Global middleware
            </Link>
          </li>
          <li>
            <Link
              href="/http/middleware/global-redirect"
              className="text-blue-500 underline"
            >
              Global middleware redirect
            </Link>
          </li>
          <li>
            <Link
              href="/http/middleware/props"
              className="text-blue-500 underline"
            >
              Props
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
