import Link from "@twofold/framework/link";
import { RouteInfo } from "./route-info";

export default function RouterPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Slow start page</h1>
      <div className="mt-3">
        Visit the{" "}
        <Link
          href="/routing/use-optimistic-route/slow-page-end?a=query"
          className="text-blue-500 underline"
        >
          slow page
        </Link>
        .
      </div>
      <div className="mt-3">
        <RouteInfo />
      </div>
    </div>
  );
}
