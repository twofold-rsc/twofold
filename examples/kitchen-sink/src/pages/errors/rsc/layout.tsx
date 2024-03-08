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
              href="/errors/rsc/rsc-throw"
              className="text-blue-500 underline"
            >
              RSC throw
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-async-throw"
              className="text-blue-500 underline"
            >
              RSC async throw
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-async-reject"
              className="text-blue-500 underline"
            >
              RSC async reject
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-suspended-throw"
              className="text-blue-500 underline"
            >
              RSC suspended throw
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-no-default-export"
              className="text-blue-500 underline"
            >
              RSC no default export
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-layout-no-default-export"
              className="text-blue-500 underline"
            >
              RSC layout no default export
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-missing-import"
              className="text-blue-500 underline"
            >
              RSC missing import
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/rsc-syntax-error"
              className="text-blue-500 underline"
            >
              RSC syntax error
            </Link>
          </li>
          <li>
            <Link
              href="/errors/rsc/this-url-doesnt-exist"
              className="text-blue-500 underline"
            >
              RSC page doesn't exist
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
