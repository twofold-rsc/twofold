export class RedirectError extends Error {
  isTwofoldError = true;
  name = "RedirectError";

  constructor(status: number, url: string) {
    let encodedUrl = encodeURIComponent(url);
    super(`TwofoldRedirectError:${status}:${encodedUrl}`);
  }
}
