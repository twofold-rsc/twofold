import Link from "@twofold/framework/link";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <div>
        <ul>
          <li>
            <Link href="/examples/email-client/1">Email 1</Link>
          </li>
          <li>
            <Link href="/examples/email-client/2">Email 2</Link>
          </li>
        </ul>
      </div>
      <div>{children}</div>
    </div>
  );
}
