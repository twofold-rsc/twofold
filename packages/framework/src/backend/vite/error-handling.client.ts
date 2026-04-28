import { ErrorInfo } from "react";
import {
  isNotFoundError,
  isUnauthorizedError,
} from "../runtime/helpers/errors.js";

export type ClientErrorContext = {
  isSsr: boolean;
  url: URL;
  error: unknown;
} & (
  | {
      errorInfo: {
        componentStack?: string | undefined;
        errorBoundary?: React.Component<unknown> | undefined;
      };
      type: "caught";
    }
  | {
      errorInfo: { componentStack?: string | undefined };
      type: "uncaught";
    }
  | {
      errorInfo: ErrorInfo;
      type: "recoverable";
    }
);

// Recoverable error while rendering on client or SSR.
// This should report the error as a client-side error.
export function onClientSideRenderError(context: ClientErrorContext) {
  console.error(context.error);

  if (isNotFoundError(context.error) || isUnauthorizedError(context.error)) {
    // These should already have been reported by the server.
  } else {
    //console.error(context.error);
  }
}
