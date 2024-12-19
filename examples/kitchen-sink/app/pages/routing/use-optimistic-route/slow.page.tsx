import Link from "@twofold/framework/link";
import { RouteInfo } from "./route-info";

export default async function SlowPage() {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Slow route</h1>
      <div className="mt-3">
        This page took 2 seconds to load.{" "}
        <Link
          href="/routing/use-optimistic-route"
          className="text-blue-500 underline"
        >
          Go back
        </Link>{" "}
        to the start page.
      </div>
      <div className="mt-3">
        <RouteInfo />
      </div>
    </div>
  );
}
