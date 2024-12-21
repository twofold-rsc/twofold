import Link from "@twofold/framework/link";
import { PageProps } from "@twofold/framework/types";
import { ClientSideParams } from "./client-side-params";
import { VerifySearchParams } from "./verify-search-params";

export default function SearchParams({ searchParams }: PageProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tighter">Search params</h1>
      <div className="mt-8">
        <div className="text-sm text-gray-500">Server side search params</div>
        <div>{searchParams.size > 0 ? searchParams.toString() : "None"}</div>
      </div>
      <div className="mt-3">
        <ClientSideParams />
      </div>

      <VerifySearchParams
        serializedServerSearchParams={Object.fromEntries(searchParams)}
      />

      <div className="mt-8 flex flex-col space-y-4">
        <Link
          href="/routing/search-params"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          (no search params)
        </Link>
        <Link
          href="/routing/search-params?foo=bar"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          ?foo=bar
        </Link>

        <Link
          href="/routing/search-params?abc=123"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          ?abc=123
        </Link>

        <Link
          href="/routing/search-params?foo=bar&abc=123"
          className="text-blue-500 hover:text-blue-600 hover:underline"
        >
          ?foo=bar&abc=123
        </Link>
      </div>
    </div>
  );
}
