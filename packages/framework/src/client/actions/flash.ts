import "server-only";
import { getStore } from "../../backend/stores/rsc-store";

export function flash(message: string) {
  let store = getStore();
  store.flash.add(message);
}
