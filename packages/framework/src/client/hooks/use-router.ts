import { useContext } from "react";
import { Context } from "../apps/client/contexts/routing-context";

export function useRouter() {
  let context = useContext(Context);

  return {
    path: context.path,
    mask: context.mask,
    searchParams: context.searchParams,
    navigate: context.navigate,
    replace: context.replace,
    refresh: context.refresh,
  };
}
