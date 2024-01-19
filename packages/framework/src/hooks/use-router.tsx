import { useContext } from "react";
import { Context } from "../clients/shared/routing-context";

export function useRouter() {
  let context = useContext(Context);

  return {
    path: context.path,
    navigate: context.navigate,
    refresh: context.refresh,
  };
}
