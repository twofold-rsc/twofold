import {
  isNotFoundError,
  isUnauthorizedError,
} from "../runtime/helpers/errors.js";

// Recoverable error while rendering on client.
// This should report the error as a client-side error.
export function onClientSidePageRenderError(url: URL, error: unknown) {
  if (isNotFoundError(error) || isUnauthorizedError(error)) {
    // These should already have been reported by the server.
  } else {
    console.error(error);
  }
}
