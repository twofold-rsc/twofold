import { ReactNode } from "react";
import { EnterDocsAnimation } from "../enter-docs";
import { NavLink } from "../../components/nav-link";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <EnterDocsAnimation>
      <header className="flex items-center justify-center space-x-10 border-b border-gray-300 py-4 shadow-sm">
        <NavLink
          href="/"
          navigatingClassName="text-gray-900"
          idleClassName="text-gray-500"
        >
          Home
        </NavLink>
        <NavLink
          href="/docs"
          match="beginning"
          navigatingClassName="text-gray-900"
          idleClassName="text-gray-500"
        >
          Docs
        </NavLink>
        <NavLink
          href="/blog"
          match="beginning"
          navigatingClassName="text-gray-900"
          idleClassName="text-gray-500"
        >
          Blog
        </NavLink>
        <a
          href="https://github.com/twofold-rsc/twofold"
          className="text-gray-500"
        >
          Github
        </a>
      </header>

      {children}
    </EnterDocsAnimation>
  );
}
