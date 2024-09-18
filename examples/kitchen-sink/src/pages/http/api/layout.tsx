import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex space-x-12">
      <div>
        <h2 className="text-lg font-semibold">API</h2>
        <ul>
          <li>
            <Link href="/http/api" className="text-blue-500 underline">
              API routes
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/request-info"
              className="text-blue-500 underline"
            >
              Read request
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/middleware"
              className="text-blue-500 underline"
            >
              Middleware
            </Link>
          </li>
          <li>
            <Link href="/http/api/post" className="text-blue-500 underline">
              POST handler
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/streaming"
              className="text-blue-500 underline"
            >
              Streaming
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/index-file"
              className="text-blue-500 underline"
            >
              Index
            </Link>
          </li>
          <li>
            <Link href="/http/api/dynamic" className="text-blue-500 underline">
              Dynamic
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/missing-file"
              className="text-blue-500 underline"
            >
              Missing file
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/missing-export"
              className="text-blue-500 underline"
            >
              Missing export
            </Link>
          </li>
          <li>
            <Link href="/http/api/errors" className="text-blue-500 underline">
              Errors
            </Link>
          </li>
          <li>
            <Link href="/http/api/cookies" className="text-blue-500 underline">
              Cookies
            </Link>
          </li>
          <li>
            <Link href="/http/api/redirect" className="text-blue-500 underline">
              Redirect
            </Link>
          </li>
          <li>
            <Link
              href="/http/api/not-found"
              className="text-blue-500 underline"
            >
              Not found
            </Link>
          </li>
          <li>
            <Link href="/http/api/image" className="text-blue-500 underline">
              Image
            </Link>
          </li>
          <li>RSC</li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
