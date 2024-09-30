export function forwardedRequest(request: Request) {
  let headers = request.headers;

  if (!headers.has("x-forwarded-proto") && !headers.has("x-forwarded-host")) {
    return request;
  }

  let originalUrl = new URL(request.url);
  originalUrl.protocol =
    request.headers.get("x-forwarded-proto") || originalUrl.protocol;
  originalUrl.host =
    request.headers.get("x-forwarded-host") || originalUrl.host;

  return new Request(originalUrl.toString(), request);
}
