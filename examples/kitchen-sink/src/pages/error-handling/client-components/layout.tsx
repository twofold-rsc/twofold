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
              href="/error-handling/client-components/cc-throws-in-browser"
              className="text-blue-500 underline"
            >
              Client browser error
            </Link>
          </li>
          <li>
            <Link
              href="/error-handling/client-components/cc-import-error"
              className="text-blue-500 underline"
            >
              Client import error
            </Link>
          </li>
          <li>
            <Link
              href="/error-handling/client-components/cc-syntax-error"
              className="text-blue-500 underline"
            >
              Client syntax error
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
