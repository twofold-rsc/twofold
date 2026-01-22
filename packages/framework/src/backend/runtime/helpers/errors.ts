export function isNotFoundError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest === "TwofoldNotFoundError"
  );
}

export function isRedirectError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldRedirectError")
  );
}

export function isUnauthorizedError(err: unknown): err is Error {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldUnauthorizedError")
  );
}

export function redirectErrorToResponse(err: Error & { digest: string }) {
  let [name, status, url] = err.digest.split(":");

  if (!url) {
    throw new Error("Invalid redirect");
  }

  return new Response(null, {
    status: Number(status),
    headers: {
      Location: decodeURIComponent(url),
    },
  });
}

export function redirectErrorInfo(err: unknown) {
  if (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldRedirectError")
  ) {
    let [name, status, url] = err.digest.split(":");

    if (!url) {
      throw new Error("Invalid redirect");
    }

    return {
      status: Number(status),
      url: decodeURIComponent(url),
    };
  } else {
    throw new Error("Invalid redirect");
  }
}

export class NotFoundError extends Error {
  isTwofoldError = true;
  name = "TwofoldNotFoundError";
  digest = "TwofoldNotFoundError";

  constructor() {
    super("TwofoldNotFoundError");
  }
}
