import "server-only";
import { RedirectError } from "../errors/redirect-error";

export function redirect(url: string, options?: { permanent: boolean }): never {
  let status = options?.permanent ? 308 : 307;
  throw new RedirectError(status, url);
}
