export function isNotFoundError(err: unknown) {
  return (
    err instanceof Error &&
    "isTwofoldError" in err &&
    err.name === "NotFoundError"
  );
}

export function isRedirectError(err: unknown) {
  return (
    err instanceof Error &&
    "isTwofoldError" in err &&
    err.name === "RedirectError"
  );
}

export function redirectErrorToResponse(err: Error) {
  let [name, status, url] = err.message.split(":");

  return new Response(null, {
    status: Number(status),
    headers: {
      Location: decodeURIComponent(url),
    },
  });
}

export function redirectErrorInfo(err: unknown) {
  if (err instanceof Error) {
    let [name, status, url] = err.message.split(":");
    return {
      status: Number(status),
      url: decodeURIComponent(url),
    };
  } else {
    throw new Error("Invalid redirect");
  }
}
