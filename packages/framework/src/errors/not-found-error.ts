export class NotFoundError extends Error {
  isTwofoldError = true;
  name = "NotFoundError";

  constructor() {
    super("TwofoldNotFoundError");
  }
}
