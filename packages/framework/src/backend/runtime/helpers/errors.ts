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

export function redirectErrorToResponse(err: Error & { digest: string }) {
  let [name, status, url] = err.digest.split(":");

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
    return {
      status: Number(status),
      url: decodeURIComponent(url),
    };
  } else {
    throw new Error("Invalid redirect");
  }
}
