import { use, useEffect, useReducer } from "react";
import { RouteStackEntry } from "../../../../client/apps/client/contexts/route-stack-context.js";
import { RscPayload } from "../payload.js";
import {
  createRscRenderRequest,
  getPathForRouterFromRscUrl,
  TwofoldInitiator,
} from "../request.js";
import { getInitialPayload } from "./initial-payload.js";
import { fetchPageAsRscPayload } from "./call-server.js";

type State = {
  version: number;
  path: string;
  mask: string | undefined;
  action: "seed" | "render" | "refresh" | "navigate" | "popstate";
  history: "none" | "push" | "replace";
  scroll: "top" | "preserve";
  cache: Map<string, RouteStackEntry[]>;
};

let fetchCache = new Map<string, Promise<RscPayload>>();
let initialState = getInitialRouterState();

export function useRouterReducer() {
  let [thenableState, dispatch] = useReducer(reducer, initialState);
  let finalizedState = use(thenableState);

  let { cache, mask, path } = finalizedState;

  if (!cache.has(path)) {
    // we got asked to render a path and we don't have a stack for it.
    dispatch({
      type: "RENDER",
      path,
      mask,
    });
  }

  useEffect(() => {
    fetchCache.clear();
    routerStateCache.clear();
  }, [finalizedState]);

  let returnedState = {
    version: finalizedState.version,
    path: finalizedState.path,
    mask: finalizedState.mask,
    action: finalizedState.action,
    history: finalizedState.history,
    scroll: finalizedState.scroll,
    stack: cache.get(path),
  };

  return [returnedState, dispatch] as const;
}

type NavigateAction = {
  type: "NAVIGATE";
  path: string;
  mask: string | undefined;
  using: "push" | "replace";
  scroll: "top" | "preserve";
  fetch: boolean;
};

type PopAction = {
  type: "POP";
  path: string;
  mask: string | undefined;
};

type RefreshAction = {
  type: "REFRESH";
};

type PopulateAction = {
  type: "POPULATE";
  path: string;
};

type RenderAction = {
  type: "RENDER";
  path: string;
  mask: string | undefined;
};

type UpdateAction = {
  type: "UPDATE";
  path: string;
  stack: RouteStackEntry[];
  updateId: string;
};

type Action =
  | NavigateAction
  | PopAction
  | RefreshAction
  | PopulateAction
  | RenderAction
  | UpdateAction;

function reducer(state: Promise<State>, action: Action): Promise<State> {
  switch (action.type) {
    case "NAVIGATE":
      return createRouterState({
        cacheKey: `navigate-${action.path}`,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);
          let path = action.path;

          if (action.fetch) {
            let rsc = await fetchRscPayload(action.path, {
              initiator: "client-side-navigation",
            });

            path = rsc.path;
            newCache.set(rsc.path, rsc.stack);
          }

          return {
            ...previous,
            version: previous.version + 1,
            path,
            mask: action.mask,
            action: "navigate",
            history: action.using,
            scroll: action.scroll,
            cache: newCache,
          };
        },
      });
    case "POP":
      return createRouterState({
        cacheKey: `pop-${action.path}`,
        async reduce() {
          let previous = await state;

          return {
            ...previous,
            version: previous.version + 1,
            path: action.path,
            mask: action.mask,
            action: "popstate",
            history: "none",
          };
        },
      });
    case "REFRESH":
      return createRouterState({
        cacheKey: `refresh`,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRscPayload(previous.path, {
            initiator: "refresh",
          });

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.stack);

          return {
            ...previous,
            version: previous.version + 1,
            action: "refresh",
            history: "none",
            cache: newCache,
          };
        },
      });
    case "POPULATE":
      return createRouterState({
        cacheKey: `populate-${action.path}`,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRscPayload(action.path, {
            initiator: "populate",
          });

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.stack);

          if (action.path !== rsc.path) {
            // we're trying to populate action.path, but the rsc fetch is
            // is giving us a stack for a different path. this is likely
            // because of a redirect.
            //
            // we need to fulfill the populate request, so we're also
            // going to store the stack in the path we were asked to
            // populate.
            //
            // longer term: this should really put in some sort of stub that
            // says action.path should redirect to rsc.path.
            newCache.set(action.path, rsc.stack);
          }

          return {
            ...previous,
            version: previous.version + 1,
            cache: newCache,
          };
        },
      });
    case "RENDER":
      return createRouterState({
        cacheKey: `populate-${action.path}`,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRscPayload(action.path, {
            initiator: "populate",
          });

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.stack);

          return {
            ...previous,
            version: previous.version + 1,
            path: rsc.path,
            mask: action.mask,
            action: "render",
            history: "replace",
            cache: newCache,
          };
        },
      });
    case "UPDATE":
      return createRouterState({
        cacheKey: `update-${action.path}-${action.updateId}`,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);
          newCache.set(action.path, action.stack);

          return {
            ...previous,
            action: "refresh",
            cache: newCache,
          };
        },
      });

    default:
      throw new Error(`Unknown action`);
  }
}

let routerStateCache = new Map<string, Promise<State>>();

function createRouterState({
  cacheKey,
  reduce,
}: {
  cacheKey: string;
  reduce: () => State | Promise<State>;
}) {
  if (!routerStateCache.get(cacheKey)) {
    let routerStatePromise = new Promise<State>((resolve) => resolve(reduce()));
    routerStateCache.set(cacheKey, routerStatePromise);
  }

  let routerStatePromise = routerStateCache.get(cacheKey);
  if (!routerStatePromise) {
    throw new Error(`Could not find routing state for cacheKey: ${cacheKey}`);
  }

  return routerStatePromise;
}

type FetchOptions = {
  initiator?: TwofoldInitiator;
  resource?: "page";
};

async function fetchRscPayload(
  path: string,
  options: FetchOptions = {},
): Promise<RscPayload> {
  const initiator = options.initiator ?? "not-specified";
  const targetUrl = new URL(path, window.location.href).href;
  const renderRequest = createRscRenderRequest(targetUrl, { initiator });
  const renderUrl = new URL(renderRequest.url);
  const cacheKey = `${initiator}:${getPathForRouterFromRscUrl(renderUrl)}`;
  if (!fetchCache.has(cacheKey)) {
    fetchCache.set(
      cacheKey,
      (async () => {
        return await fetchPageAsRscPayload(renderRequest);
      })(),
    );
  }
  return fetchCache.get(cacheKey)!;
}

async function getInitialRouterState() {
  let initialPath =
    typeof window !== "undefined" ? getPathForRouterFromRscUrl(location) : "/";
  let cache = new Map<string, RouteStackEntry[]>();
  let path = initialPath;

  const initialPayload = await getInitialPayload();
  cache.set(initialPath, initialPayload.stack);

  let state: State = {
    version: 1,
    path,
    mask: undefined,
    action: "seed",
    history: "none",
    scroll: "preserve",
    cache,
  };

  return state;
}
