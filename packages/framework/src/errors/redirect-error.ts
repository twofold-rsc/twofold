export class RedirectError extends Error {
  isTwofoldError = true;
  name = "TwofoldRedirectError";
  digest: string;

  constructor(status: number, url: string) {
    let encodedUrl = encodeURIComponent(url);
    super(`TwofoldRedirectError:${status}:${encodedUrl}`);
    this.digest = `TwofoldRedirectError:${status}:${encodedUrl}`;
  }
}
