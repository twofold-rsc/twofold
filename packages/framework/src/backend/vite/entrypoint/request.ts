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

export function getPathForRscRequest(pageUrl: URL | string) {
  const encodedPath = encodeURIComponent(
    typeof pageUrl === "string" ? pageUrl : getPathForRouterFromRscUrl(pageUrl),
  );
  return `${rscPageUrlPrefix}?path=${encodedPath}`;
}

export function getPathForRouterFromRscUrl(url: URL | Location) {
  return `${url.pathname}${url.search}${url.hash}`;
}
