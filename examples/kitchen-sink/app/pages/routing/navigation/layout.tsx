import { ReactNode } from "react";
import Link from "@twofold/framework/link";
import { LinkWithNavigation } from "./link-with-transition";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">Navigation</h2>
        <ul>
          <li>
            <Link
              href="/routing/navigation/ending"
              className="text-blue-500 underline"
            >
              Load a page
            </Link>
          </li>
          <li>
            <Link href="https://github.com" className="text-blue-500 underline">
              External link
            </Link>
          </li>
          <li>
            <Link
              href="/routing/navigation/ending"
              replace={true}
              className="text-blue-500 underline"
            >
              Replace a page
            </Link>
          </li>
          <li>
            <LinkWithNavigation href="/routing/navigation/ending">
              Custom transition
            </LinkWithNavigation>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
