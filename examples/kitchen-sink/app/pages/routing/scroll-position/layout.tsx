import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function ScrollPositionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex space-x-4">
      <ul className="min-w-[120px]">
        <li>
          <Link href="/routing/scroll-position">Home</Link>
        </li>
        <li>
          <Link href="/routing/scroll-position/text">Text</Link>
        </li>
        <li>
          <Link href="/routing/scroll-position/html">HTML</Link>
        </li>
        <li>
          <Link href="/routing/scroll-position/suspense-boundary">
            Suspense boundary
          </Link>
        </li>
        <li>
          <Link href="/routing/scroll-position/suspense-blocking">
            Suspense blocking
          </Link>
        </li>
      </ul>
      <div>{children}</div>
    </div>
  );
}
