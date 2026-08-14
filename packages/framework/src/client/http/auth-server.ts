import "server-only";
import { getStore } from "../../backend/stores/rsc-store";

/**
 * Returns a value that was stored by an authentication policy in the authentication cache (via props.authCache).
 *
 * @param key The key that the authentication policy set the value into.
 * @returns The value that was previously stored, or undefined.
 */
export function getValueFromAuthCache<T>(key: string) {
  return getStore().authCache.get(key) as T | undefined;
}
