import { contentType, headerAccept } from "../content-types.js";

export const rscActionUrlPrefix = "/__rsc/action";
export const rscPageUrlPrefix = "/__rsc/page";

export const headerTwofoldServerReference = "x-twofold-server-reference";
export const headerTwofoldInitiator = "x-twofold-initiator";
export const headerTwofoldPath = "x-twofold-path";

export type TwofoldInitiator =
  | "call-server"
  | "client-side-navigation"
  | "refresh"
  | "populate"
  | "initial-render"
  | "not-specified";
export const twofoldInitiator = {
  callServer: "call-server" as TwofoldInitiator,
  clientSideNavigation: "client-side-navigation" as TwofoldInitiator,
  refresh: "refresh" as TwofoldInitiator,
  populate: "populate" as TwofoldInitiator,
  initialRender: "initial-render" as TwofoldInitiator,
  notSpecified: "not-specified" as TwofoldInitiator,
};

type RenderRequest = {
  isRsc: boolean;
  isAction: boolean;
  actionId?: string;
  request: Request;
  url: URL;
};

export function createRscActionRequest(id: string, body: BodyInit): Request {
  const browserPath = getPathForRouterFromRscUrl(location);
  const twofoldPath = window.__twofold?.currentPath;

  const path = twofoldPath ?? browserPath;
  const encodedPath = encodeURIComponent(path);
  const encodedId = encodeURIComponent(id);

  return new Request(`${rscActionUrlPrefix}/${encodedId}?path=${encodedPath}`, {
    method: "POST",
    headers: {
      [headerAccept]: contentType.rsc,
      [headerTwofoldInitiator]: twofoldInitiator.callServer,
      [headerTwofoldServerReference]: id,
      [headerTwofoldPath]: path,
    },
    body: body,
  });
}

export function createRscRenderRequest(
  path: string,
  options: { initiator?: TwofoldInitiator } = {},
): Request {
  const encodedPath = encodeURIComponent(path);
  const initiator = options.initiator ?? twofoldInitiator.notSpecified;

  return new Request(`${rscPageUrlPrefix}?path=${encodedPath}`, {
    method: "GET",
    headers: {
      [headerAccept]: contentType.rsc,
      [headerTwofoldInitiator]: initiator,
    },
  });
}

export function parseRenderRequest(request: Request): RenderRequest {
  const url = new URL(request.url);
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

export function getPathForRouterFromRscUrl(url: URL | Location) {
  return `${url.pathname}${url.search}${url.hash}`;
}
