export class UnauthorizedError extends Error {
  isTwofoldError = true;
  name = "TwofoldUnauthorizedError";
  digest = "TwofoldUnauthorizedError";

  _tag = "unauthorized";

  constructor() {
    super("TwofoldUnauthorizedError");
  }
}
