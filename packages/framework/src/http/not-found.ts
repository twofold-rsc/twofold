import { NotFoundError } from "../errors/not-found-error";

export function notFound(): never {
  throw new NotFoundError();
}
