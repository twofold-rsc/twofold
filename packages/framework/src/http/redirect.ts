import "server-only";
import { RedirectError } from "../errors/redirect-error";

export function redirect(url: string): never {
  throw new RedirectError(307, url);
}
