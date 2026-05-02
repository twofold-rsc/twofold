import "client-only";
import { contentType, headerAccept } from "../content-types.js";
import {
  getPathForRouterFromRscUrl,
  getPathForRscRequest,
  headerTwofoldInitiator,
  headerTwofoldPath,
  headerTwofoldServerReference,
  rscActionUrlPrefix,
  twofoldInitiator,
  TwofoldInitiator,
} from "./request.js";

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
  const initiator = options.initiator ?? twofoldInitiator.notSpecified;

  return new Request(getPathForRscRequest(path), {
    method: "GET",
    headers: {
      [headerAccept]: contentType.rsc,
      [headerTwofoldInitiator]: initiator,
    },
  });
}
