import { useContext } from "react";
import { Context } from "../apps/client/contexts/routing-context";

export function useOptimisticRoute() {
  let context = useContext(Context);

  return {
    path: context.optimisticPath,
    searchParams: context.optimisticSearchParams,
    isTransitioning: context.isTransitioning,
  };
}
