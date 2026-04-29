import "server-only";
import { parseHeaderValue } from "@hattip/headers";
import { headerContentType } from "../content-types.js";
import { decodeFormState } from "@vitejs/plugin-rsc/rsc";
import {
  rscPageUrlPrefix,
  rscActionUrlPrefix,
  headerTwofoldServerReference,
} from "./request.js";

export enum RenderRequestActionType {
  Request,
  FormState,
}

type RenderRequest =
  | {
      isRsc: boolean;
      isAction: true;
      actionId: string;
      actionType: RenderRequestActionType;
      request: Request;
      url: URL;
    }
  | {
      isRsc: boolean;
      isAction: false;
      request: Request;
      url: URL;
    };

type ReactFormStateInternal = [
  any /* actual state value */,
  string /* key path */,
  string /* reference ID */,
  number /* number of bound arguments */,
];

export async function parseRenderRequest(
  request: Request,
): Promise<RenderRequest> {
  const url = new URL(request.url);

  // Form submission by clients who do not have JavaScript enabled.
  // In this case, the URL does not have the /__rsc/ prefix.
  if (request.method === "POST") {
    const [contentType] = parseHeaderValue(
      request.headers.get(headerContentType),
    );
    if (contentType && contentType.value === "multipart/form-data") {
      const clonedRequest = request.clone();
      const resolvedFormData = await clonedRequest.formData();
      const formState = (await decodeFormState(null, resolvedFormData)) as
        | ReactFormStateInternal
        | undefined;
      if (formState !== undefined && formState !== null) {
        return {
          isRsc: false,
          isAction: true,
          actionId: formState[2],
          actionType: RenderRequestActionType.FormState,
          request: request,
          url: url,
        };
      }
    }
  }

  // JavaScript initiated actions and RSC requests via /__rsc/.
  const isRscPath = url.pathname === rscPageUrlPrefix;
  const isRscAction = url.pathname.startsWith(`${rscActionUrlPrefix}/`);
  if (isRscPath || isRscAction) {
    const requestUrl = new URL(url.searchParams.get("path")!, url);
    if (isRscPath) {
      return {
        isRsc: true,
        isAction: false,
        request: new Request(requestUrl, request),
        url: requestUrl,
      };
    } else if (isRscAction) {
      const actionId =
        request.headers.get(headerTwofoldServerReference) || undefined;
      return {
        isRsc: true,
        isAction: true,
        actionId: actionId!,
        actionType: RenderRequestActionType.Request,
        request: new Request(requestUrl, request),
        url: requestUrl,
      };
    }
  }

  return {
    isRsc: false,
    isAction: false,
    request,
    url,
  };
}
