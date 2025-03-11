import "client-only";
import { use } from "react";
import { FlashContext } from "../components/flash-provider";

export function useFlash() {
  return use(FlashContext);
}

export function flash(message: string) {
  if (window.__twofold?.flash) {
    window.__twofold.flash(message);
  }
}
