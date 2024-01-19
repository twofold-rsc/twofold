import { getStore } from "../backend/store.js";

if (typeof window !== "undefined") {
  throw new Error("useActionResult is only available inside server components");
}

type Action = ((...args: any[]) => any) & {
  $$id?: string;
};

export function useResult<T extends Action>(
  action: T
): Awaited<ReturnType<T>> | void {
  let key = action.$$id;

  if (!key) {
    throw "Non server action passed to useResult";
  }

  let store = getStore();

  if (store.actions.results[key]) {
    return store.actions.results[key];
  }
}
