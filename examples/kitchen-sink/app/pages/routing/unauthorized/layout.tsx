import Link from "@twofold/framework/link";
import { LayoutProps } from "@twofold/framework/types";

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Unauthorized</h2>
        <ul>
          <li>
            <Link
              href="/routing/unauthorized/page-calls-unauthorized"
              className="text-blue-500 underline"
            >
              Page calls unauthorized
            </Link>
          </li>
          <li>
            <Link
              href="/routing/unauthorized/middleware-calls-unauthorized"
              className="text-blue-500 underline"
            >
              Middleware calls unauthorized
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
