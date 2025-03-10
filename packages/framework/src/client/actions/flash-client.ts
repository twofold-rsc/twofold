import "client-only";
import { use } from "react";
import { FlashContext } from "../components/flash-provider";

export function useFlash() {
  return use(FlashContext);
}

export function flash(message: string) {
  console.log("client side flash", message);
}
