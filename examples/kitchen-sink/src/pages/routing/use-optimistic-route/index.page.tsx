import Link from "@twofold/framework/link";
import { RouteInfo } from "./route-info";

export default function RouterPage() {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Optimistic Route</h1>
      <div className="mt-3">
        Visit the{" "}
        <Link
          href="/routing/use-optimistic-route/slow?a=query"
          className="text-blue-500 underline"
        >
          slow route
        </Link>
        .
      </div>
      <div className="mt-3">
        <RouteInfo />
      </div>
    </div>
  );
}
