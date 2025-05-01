import Link from "@twofold/framework/link";
import { LayoutProps } from "@twofold/framework/types";

export default function PathlessLayout({ children }: LayoutProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Pathless layout</h1>

      <div className="mt-8 grid grid-cols-8">
        <div className="col-span-2">
          <div className="text-sm font-bold">Nav</div>
          <div>
            <Link
              href="/routing/pathless"
              className="text-blue-500 hover:underline"
            >
              Index
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/fixed"
              className="text-blue-500 hover:underline"
            >
              Fixed page
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/1"
              className="text-blue-500 hover:underline"
            >
              Dynamic 1
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/2"
              className="text-blue-500 hover:underline"
            >
              Dynamic 2
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/api"
              className="text-blue-500 hover:underline"
            >
              API route
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/wildcard/1"
              className="text-blue-500 hover:underline"
            >
              Wildcard 1
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/subroute"
              className="text-blue-500 hover:underline"
            >
              Subroute index
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/subroute/fixed"
              className="text-blue-500 hover:underline"
            >
              Subroute fixed
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/subroute/1"
              className="text-blue-500 hover:underline"
            >
              Subroute dynamic 1
            </Link>
          </div>

          <div>
            <Link
              href="/routing/pathless/subroute/2"
              className="text-blue-500 hover:underline"
            >
              Subroute dynamic 2
            </Link>
          </div>
        </div>
        <div className="col-span-6">{children}</div>
      </div>
    </div>
  );
}
