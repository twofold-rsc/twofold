import Link from "@twofold/framework/link";
import { LayoutProps } from "@twofold/framework/types";

export default function DynamicLayout({
  params,
  children,
  request,
}: LayoutProps) {
  let slug = params.slug;
  let folder = params.folder;
  let file = params.file;

  let url = new URL(request.url);
  let pathname = url.pathname;

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Dynamic URLs</h1>
      <div className="mt-4 flex space-x-20">
        <ul className="list-disc pl-4">
          <li>
            <Link
              href="/routing/dynamic"
              className={`text-blue-500 ${pathname === "/routing/dynamic" ? "underline" : ""}`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/ABC"
              className={`text-blue-500 ${slug === "ABC" ? "underline" : ""}`}
            >
              Slug ABC
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/123"
              className={`text-blue-500 ${slug === "123" ? "underline" : ""}`}
            >
              Slug 123
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/fixed"
              className={`text-blue-500 ${pathname === "/routing/dynamic/fixed" ? "underline" : ""} whitespace-nowrap`}
            >
              Fixed sibling
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/slug/doesnt-exist"
              className={`text-blue-500 ${pathname === "/routing/dynamic/slug/doesnt-exist" ? "underline" : ""} whitespace-nowrap`}
            >
              Catch all
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/nested/folder/file"
              className={`text-blue-500 ${params.folder === "folder" && params.file === "file" ? "underline" : ""} whitespace-nowrap`}
            >
              Nested folder/file
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/nested/folder/file2"
              className={`text-blue-500 ${params.folder === "folder" && params.file === "file2" ? "underline" : ""} whitespace-nowrap`}
            >
              Nested folder/file2
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/nested/folder/fixed"
              className={`text-blue-500 ${pathname === "/routing/dynamic/nested/folder/fixed" ? "underline" : ""} whitespace-nowrap`}
            >
              Nested fixed
            </Link>
          </li>
          <li>
            <Link
              href="/routing/dynamic/nested/folder/file/doesnt-exist"
              className={`text-blue-500 ${pathname === "/routing/dynamic/nested/folder/file/doesnt-exist" ? "underline" : ""} whitespace-nowrap`}
            >
              Deep catch all
            </Link>
          </li>
        </ul>
        <div>{children}</div>
      </div>
    </div>
  );
}
