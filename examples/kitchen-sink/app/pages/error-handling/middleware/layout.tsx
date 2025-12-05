import { ReactNode } from "react";
import Link from "@twofold/framework/link";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Errors</h2>
        <ul>
          <li>
            <Link
              href="/error-handling/middleware/middleware-throw"
              className="text-blue-500 underline"
            >
              Middleware throw
            </Link>
          </li>
          <li>
            <Link
              href="/error-handling/middleware/async-middleware-throw"
              className="text-blue-500 underline"
            >
              Async middleware throw
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
