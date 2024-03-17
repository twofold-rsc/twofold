export class RedirectError extends Error {
  isTwofoldError = true;
  name = "RedirectError";

  constructor(status: number, url: string) {
    let encodedUrl = encodeURI(url);
    super(`TwofoldRedirectError:${status}:${encodedUrl}`);
  }
}
