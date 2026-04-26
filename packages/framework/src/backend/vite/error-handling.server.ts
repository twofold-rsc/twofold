import kleur from "kleur";
import {
  isNotFoundError,
  isRedirectError,
  isUnauthorizedError,
  redirectErrorInfo,
} from "../runtime/helpers/errors.js";
import { ApplicationRuntime } from "./router.js";

// Catastrophic error in http pipeline that prevents us from handling error in any more sane way.
export async function onServerSideCatastrophicError(
  request: Request,
  error: unknown,
) {
  // This function doesn't yet do anything, but is where we'd report errors to our error reporting API
}

// Non-recoverable middleware error on server during API handling.
// This will cause a change in response content.
export function onServerSideApiMiddlewareError(error: unknown): Response {
  if (isNotFoundError(error)) {
    return new Response("Not found", { status: 404 });
  } else if (isUnauthorizedError(error)) {
    return new Response("Unauthorized", { status: 401 });
  } else if (isRedirectError(error)) {
    let { status, url } = redirectErrorInfo(error);
    return new Response(null, {
      status,
      headers: {
        Location: url,
      },
    });
  } else {
    throw error;
  }
}

// Non-recoverable middleware error on server during page handling.
// This will cause a change in response content.
export async function onServerSidePageMiddlewareError(
  applicationRuntime: ApplicationRuntime,
  url: URL,
  request: Request,
  error: unknown,
): Promise<Response | ReadableStream<Uint8Array>> {
  if (isNotFoundError(error)) {
    return applicationRuntime.createNotFoundResponse(request);
  } else if (isUnauthorizedError(error)) {
    return applicationRuntime.createUnauthorizedResponse(request);
  } else if (isRedirectError(error)) {
    const errorInfo = redirectErrorInfo(error);
    return applicationRuntime.createRedirectResponse(
      url,
      errorInfo.url,
      false,
      errorInfo.status,
    );
  } else {
    throw error;
  }
}

// Recoverable error will propagate to SSR.
// This should report the error as a server-side error.
export function onServerSidePageRenderError(url: URL, error: unknown) {
  if (isNotFoundError(error)) {
    console.error(`${kleur["red"](`[Not found]`)} ${url.pathname}`);
  } else if (isUnauthorizedError(error)) {
    console.error(`${kleur["red"](`[Unauthorized]`)} ${url.pathname}`);
  } else {
    console.error(error);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    // Pass digest from server to client unmodified. This is what allows the client to recognise special errors such as "not found".
    return error.digest;
  } else {
    // No digest for this error.
    return undefined;
  }
}

export function onServerSideActionError(error: unknown) {
  // This function doesn't yet do anything, but is where we'd report errors to our error reporting API
}
