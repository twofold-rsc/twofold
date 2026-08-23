import { use, useEffect, useReducer } from "react";
import {
  createFromReadableStream,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client'.
} from "react-server-dom-webpack/client";
import { callServer } from "../actions/call-server";
import { RouteStackEntry } from "../contexts/route-stack-context";

type State = {
  version: number;
  path: string;
  mask: string | undefined;
  action: "seed" | "render" | "refresh" | "navigate" | "popstate";
  history: "none" | "push" | "replace";
  scroll: "top" | "preserve";
  cache: Map<string, RouteStackEntry[]>;
};

let fetchCache = new Map<string, Promise<RSCPayload>>();
let initialState = getInitialRouterState();

export function useRouterReducer() {
  let [thenableState, dispatch] = useReducer(reducer, initialState);
  let finalizedState = use(thenableState);

  let { cache, mask, path } = finalizedState;

  if (!cache.has(path)) {
    // we got asked to render a path and we don't have a stack for it.
    // we need to lookup the action since it is created during render
    dispatch(renderAction(thenableState, path, mask));
  }

  useEffect(() => {
    // this isnt a good idea, have fetchRSCPayload own its own cache
    fetchCache.clear();
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
        state,
        action,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);
          let path = action.path;

          if (action.fetch) {
            let rsc = await fetchRSCPayload(action.path, {
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
        state,
        action,
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
        state,
        action,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRSCPayload(previous.path, {
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
        state,
        action,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRSCPayload(action.path, {
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
        state,
        action,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRSCPayload(action.path, {
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
        state,
        action,
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

let renderActionCache = new WeakMap<Promise<State>, RenderAction>();

function renderAction(
  state: Promise<State>,
  path: string,
  mask: string | undefined,
) {
  let action = renderActionCache.get(state);

  if (!action) {
    action = {
      type: "RENDER",
      path,
      mask,
    };
    renderActionCache.set(state, action);
  }

  return action;
}

let routerStateCache = new WeakMap<
  Action,
  WeakMap<Promise<State>, Promise<State>>
>();

function createRouterState({
  state,
  action,
  reduce,
}: {
  state: Promise<State>;
  action: Action;
  reduce: () => State | Promise<State>;
}) {
  let statesForAction = routerStateCache.get(action);

  if (!statesForAction) {
    statesForAction = new WeakMap();
    routerStateCache.set(action, statesForAction);
  }

  let routerStatePromise = statesForAction.get(state);

  if (!routerStatePromise) {
    routerStatePromise = new Promise<State>((resolve) => resolve(reduce()));
    statesForAction.set(state, routerStatePromise);
  }

  return routerStatePromise;
}

type RSCPayload = {
  path: string;
  stack: RouteStackEntry[];
};

type FetchOptions = {
  initiator?: string;
  resource?: "page";
};

function fetchRSCPayload(path: string, options: FetchOptions = {}) {
  let resource = options.resource ?? "page";
  let encodedPath = encodeURIComponent(path);
  let endpoint = `/__rsc/${resource}?path=${encodedPath}`;
  let initiator = options.initiator ?? "not-specified";
  let cacheKey = `${initiator}:${endpoint}`;

  if (!fetchCache.has(cacheKey)) {
    let fetchPromise = fetch(endpoint, {
      headers: {
        Accept: "text/x-component",
        "x-twofold-initiator": initiator,
      },
    }).then(async (response) => {
      let url = new URL(response.url);
      let responsePath = url.searchParams.get("path");
      let contentType = response.headers.get("content-type");
      let fetchedPath = responsePath ?? decodeURIComponent(encodedPath);
      let rscOptions = { callServer };
      let stack: RouteStackEntry[];

      if (contentType === "text/x-component") {
        let payload = await createFromReadableStream(response.body, rscOptions);
        stack = payload.stack;
      } else if (!response.ok) {
        let error = new Error(response.statusText);
        stack = [
          {
            type: "error",
            error,
          },
        ];
      } else {
        let error = new Error("Unexpected response");
        stack = [
          {
            type: "error",
            error,
          },
        ];
      }

      return {
        path: fetchedPath,
        stack,
      };
    });

    fetchCache.set(cacheKey, fetchPromise);
  }

  let result = fetchCache.get(cacheKey);
  if (!result) {
    throw new Error(`Could not find fetch for cacheKey: ${cacheKey}`);
  }

  return result;
}

async function getInitialRouterState() {
  let initialPath =
    typeof window !== "undefined"
      ? `${location.pathname}${location.search}${location.hash}`
      : "/";
  let cache = new Map<string, RouteStackEntry[]>();
  let path = initialPath;

  if (typeof window === "undefined") {
    // was called on the server, do nothing.
  } else if (window.initialRSC?.stream) {
    if (window.initialRSC.stream.locked) {
      throw new Error(
        "Attempting to read a locked stream during initialization. This is a bug in @twofold/framework, please open an issue: https://github.com/twofold-rsc/twofold/issues/new?title=Bug+attempting+to+read+locked+stream+during+initialization",
      );
    } else {
      let payload = await createFromReadableStream(window.initialRSC.stream, {
        callServer,
      });
      cache.set(initialPath, payload.stack);
    }
  } else {
    let rscPayload = await fetchRSCPayload(initialPath, {
      initiator: "initial-render",
    });
    cache.set(rscPayload.path, rscPayload.stack);
    path = rscPayload.path;
  }

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
