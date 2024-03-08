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
              href="/errors/server-actions/action-missing-use-server"
              className="text-blue-500 underline"
            >
              Server action missing use server
            </Link>
          </li>
          <li>
            <Link
              href="/errors/server-actions/action-throw"
              className="text-blue-500 underline"
            >
              Server action throw
            </Link>
          </li>
          <li>
            <Link
              href="/errors/server-actions/action-throw-client-catch"
              className="text-blue-500 underline"
            >
              Server action throw and client catch
            </Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
