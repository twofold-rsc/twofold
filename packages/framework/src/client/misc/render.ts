import "server-only";
import { getStore } from "../../backend/stores/rsc-store";
import { ReactNode } from "react";

// do not use, this is going away

export async function renderStaticHtml(tree: ReactNode) {
  let store = getStore();
  return store.render.treeToStaticHtml(tree);
}
