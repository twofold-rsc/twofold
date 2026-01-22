import { UnauthorizedError } from "../errors/unauthorized-error";

export function unauthorized(): never {
  throw new UnauthorizedError();
}
