export class NotFoundError extends Error {
  isTwofoldError = true;
  name = "TwofoldNotFoundError";
  digest = "TwofoldNotFoundError";

  constructor() {
    super("TwofoldNotFoundError");
  }
}
