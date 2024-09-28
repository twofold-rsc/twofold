import "server-only";
import { getStore } from "./backend/stores/rsc-store.js";
import { ReactNode } from "react";

export async function renderStaticHtml(tree: ReactNode) {
  let store = getStore();
  return store.render.treeToStaticHtml(tree);
}
