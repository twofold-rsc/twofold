"use client";

import { useOptimisticRoute } from "@twofold/framework/use-optimistic-route";
import { useRouter } from "@twofold/framework/use-router";

export function RouteInfo() {
  let router = useRouter();
  let optimisticRoute = useOptimisticRoute();

  return (
    <div className="">
      <table cellPadding={8} className="min-w-[400px]">
        <thead>
          <tr>
            <th className="text-left">State</th>
            <th className="text-left">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Current path:</td>
            <td>
              <span className="font-mono text-sm text-gray-900">
                {router.path}
              </span>
            </td>
          </tr>
          <tr>
            <td>Current search params: </td>
            <td>
              <span className="font-mono text-sm text-gray-900">
                {router.searchParams.toString()}
              </span>
            </td>
          </tr>
          <tr>
            <td>Optimistic path: </td>
            <td>
              <span className="font-mono text-sm text-gray-900">
                {optimisticRoute.path}
              </span>
            </td>
          </tr>
          <tr>
            <td>Optimistic search params: </td>
            <td>
              <span className="font-mono text-sm text-gray-900">
                {optimisticRoute.searchParams.toString()}
              </span>
            </td>
          </tr>
          <tr>
            <td>Router is transitioning: </td>
            <td>{optimisticRoute.isTransitioning ? "YES" : "NO"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
