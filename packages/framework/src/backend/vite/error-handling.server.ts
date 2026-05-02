import kleur from "kleur";
import {
  isNotFoundError,
  isRedirectError,
  isUnauthorizedError,
  redirectErrorInfo,
} from "../runtime/helpers/errors.js";
import { ApplicationRuntime } from "./router.js";
import { tfPaths } from "./special-pages.js";
import type { ReplacementResponse } from "./replacement-response.js";
import type { RenderRequest } from "./entrypoint/request.server.js";

export interface ServerErrorContext {
  applicationRuntime: ApplicationRuntime;
  url: URL;
  renderRequest: RenderRequest;
  error: unknown;
  willRecover: boolean;
  location:
    | "api-middleware"
    | "api"
    | "page-middleware"
    | "page"
    | "action-request"
    | "action-form"
    | "ssr"
    | undefined;
}

function logError(context: ServerErrorContext, isCatastrophic?: boolean) {
  const defaultCategory = isCatastrophic
    ? "Catastrophic"
    : "Internal server error";
  let location;
  switch (context.location) {
    case "api-middleware":
      location = " [API Middleware]";
      break;
    case "api":
      location = " [API Route]";
      break;
    case "page-middleware":
      location = " [Page Middleware]";
      break;
    case "page":
      location = " [Page]";
      break;
    case "action-request":
      location = " [Action via Request]";
      break;
    case "action-form":
      location = " [Action via Form]";
      break;
    case "ssr":
      location = " [SSR]";
      break;
    default:
      location = "";
      break;
  }
  if (location !== "") {
    location = kleur["yellow"](location);
  }
  if (context.error) {
    if (isNotFoundError(context.error)) {
      console.error(
        `${kleur["red"](`[Not found]`)}%s %s`,
        location,
        context.renderRequest.url,
      );
    } else if (isUnauthorizedError(context.error)) {
      console.error(
        `${kleur["red"](`[Unauthorized]`)}%s %s`,
        location,
        context.renderRequest.url,
      );
    } else if (isRedirectError(context.error)) {
      const redirectError = redirectErrorInfo(context.error);
      console.error(
        `${kleur["cyan"](`[Redirect]`)}%s %s -> %s`,
        location,
        context.renderRequest.url,
        redirectError.url,
      );
    } else {
      console.error(
        `${kleur["red"](`[${defaultCategory}]`)}%s %s %o`,
        location,
        context.renderRequest.url,
        context.error,
      );
    }
  } else {
    console.error(
      `${kleur["red"](`[${defaultCategory}]`)}%s %s`,
      location,
      context.renderRequest.url,
    );
  }
}

// Catastrophic error in http pipeline that prevents us from handling error in any more sane way.
export async function onServerSideCatastrophicError(
  context: ServerErrorContext,
) {
  logError(context, true);
}

// Non-recoverable middleware error on server during API handling.
// This will cause a change in response content.
export function onServerSideApiMiddlewareError(
  context: ServerErrorContext,
): Response {
  logError(context);

  if (isNotFoundError(context.error)) {
    return new Response("Not found", { status: 404 });
  } else if (isUnauthorizedError(context.error)) {
    return new Response("Unauthorized", { status: 401 });
  } else if (isRedirectError(context.error)) {
    let { status, url } = redirectErrorInfo(context.error);
    return new Response(null, {
      status,
      headers: {
        Location: url,
      },
    });
  } else {
    return new Response("Internal server error", { status: 500 });
  }
}

// Non-recoverable middleware error on server during page handling.
// This will cause a change in response content.
export async function onServerSidePageMiddlewareError(
  context: ServerErrorContext,
): Promise<ReplacementResponse> {
  logError(context);

  if (isNotFoundError(context.error)) {
    return context.applicationRuntime.runSpecialPage(
      context.renderRequest,
      tfPaths.throwing.notFound,
    );
  } else if (isUnauthorizedError(context.error)) {
    return context.applicationRuntime.runSpecialPage(
      context.renderRequest,
      tfPaths.throwing.unauthorized,
    );
  } else if (isRedirectError(context.error)) {
    const errorInfo = redirectErrorInfo(context.error);
    return context.applicationRuntime.createRedirectResponse(
      context.renderRequest,
      errorInfo.url,
      errorInfo.status,
    );
  } else {
    return context.applicationRuntime.runSpecialPage(
      context.renderRequest,
      tfPaths.throwing.internalServerError,
      context.error,
    );
  }
}

// Recoverable error will propagate to SSR.
// This should report the error as a server-side error.
export function onServerSidePageRenderError(context: ServerErrorContext) {
  logError(context);

  if (
    typeof context.error === "object" &&
    context.error !== null &&
    "digest" in context.error &&
    typeof context.error.digest === "string"
  ) {
    // Pass digest from server to client unmodified. This is what allows the client to recognise special errors such as "not found".
    return context.error.digest;
  } else {
    // No digest for this error.
    return undefined;
  }
}

export async function onServerSideActionError(
  context: ServerErrorContext,
): Promise<ReplacementResponse> {
  logError(context);

  if (isRedirectError(context.error)) {
    const redirectInfo = redirectErrorInfo(context.error);
    return context.applicationRuntime.createRedirectResponse(
      context.renderRequest,
      redirectInfo.url,
    );
  }
}
