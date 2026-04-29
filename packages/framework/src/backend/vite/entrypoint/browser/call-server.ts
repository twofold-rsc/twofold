import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
} from "@vitejs/plugin-rsc/browser";
import type { RscPayload } from "../payload.js";
import { RedirectError } from "../../../../client/errors/redirect-error.js";
import { headerContentType, isContentType } from "../../content-types.js";
import { parseHeaderValue } from "@hattip/headers";
import { createRscActionRequest } from "../request.client.js";
import { getPathForRouterFromRscUrl } from "../request.js";

function getOriginalPathFromRscUrlForCatastrophicError(url: URL) {
  if (url.pathname.startsWith("/__rsc/")) {
    return new URL(url.searchParams.get("path")!, window.location.href);
  } else {
    return url;
  }
}

export async function fetchPageAsRscPayload(
  renderRequest: Request,
): Promise<RscPayload> {
  const response = await fetch(renderRequest);
  const contentType = response.headers.get(headerContentType);
  if (isContentType.rsc(contentType)) {
    // Got an RSC stream, which is what we expect.
    return await createFromReadableStream<RscPayload>(response.body!, {});
  } else {
    // Got some other kind of content or HTTP response. This usually
    // means there's a catastrophic error on the server such that it
    // can't provide an RSC stream. We need to synthesize an error
    // response so that the router will correctly add the attempted
    // URL to the history.
    return {
      stack: [
        {
          type: "error",
          error:
            response.statusText.trim() === ""
              ? new Error(`${response.status}`)
              : new Error(`${response.status}: ${response.statusText}`),
        },
      ],
      path: getPathForRouterFromRscUrl(
        getOriginalPathFromRscUrlForCatastrophicError(
          new URL(renderRequest.url),
        ),
      ),
      action: undefined,
      formState: undefined,
    };
  }
}

export async function callServerAction(id: string, args: any) {
  const temporaryReferences = createTemporaryReferenceSet();
  const renderRequest = createRscActionRequest(
    id,
    await encodeReply(args, { temporaryReferences }),
  );

  const browserPath = getPathForRouterFromRscUrl(location);
  const twofoldPath = window.__twofold?.currentPath;

  const path = twofoldPath ?? browserPath;

  const response = await fetch(renderRequest);
  const contentType = parseHeaderValue(response.headers.get(headerContentType));

  let stack;
  let result;

  if (isContentType.rsc(contentType)) {
    const streams = await createFromReadableStream<RscPayload>(response.body!, {
      temporaryReferences,
    });

    stack = streams.stack;
    const action = streams.action ?? { type: "undefined", result: undefined };

    if (action.type === "return") {
      // normal return from action
      result = action.result;
    } else if (action.type === "throw") {
      // action threw an error. put it into an rsc render stream
      // so it triggers an error boundary. it feels like there
      // should be a better way to do this. my mental model is
      // off here because i thought errors thrown in transitions trigger
      // boundaries, but that won't work unless we put it into a stream.
      let stream = new ReadableStream({
        start(controller) {
          controller.error(action.error);
        },
      });
      result = createFromReadableStream(stream, {});
    }
  } else if (isContentType.json(contentType)) {
    let json = await response.json();
    if (json.type === "twofold-offsite-redirect") {
      window.location.href = json.url;
    }
  } else if (!response.ok) {
    let error = new Error(response.statusText);
    let stream = new ReadableStream({
      start(controller) {
        controller.error(error);
      },
    });
    result = createFromReadableStream(stream, {});
  }

  let url = new URL(response.url);
  let receivedPath = url.searchParams.get("path");
  let pathToUpdate = response.redirected && receivedPath ? receivedPath : path;

  if (stack && window.__twofold?.updateStack) {
    window.__twofold.updateStack(pathToUpdate, stack);
  }

  if (response.redirected) {
    if (window.__twofold?.navigate) {
      window.__twofold.navigate(pathToUpdate);
    }

    // we need to reject here because if this call server was
    // invoked by a action expecting a typed value we don't
    // want to return undefined.
    throw new RedirectError(response.status, pathToUpdate);
  } else {
    return result;
  }
}
