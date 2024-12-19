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
              href="/error-handling/ssr/ssr-throw"
              className="text-blue-500 underline"
            >
              SSR throw
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
