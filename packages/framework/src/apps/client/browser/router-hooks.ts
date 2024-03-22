import { use, useEffect, useReducer } from "react";
import { deserializeError } from "serialize-error";
import {
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { callServer } from "../actions/call-server";

type Tree = any;

type State = {
  path: string;
  action: "none" | "refresh" | "navigate" | "popstate";
  history: "none" | "push" | "replace";
  cache: Map<string, Tree>;
};

let initialState = getInitialRouterState();

export function useRouterReducer() {
  let [thenableState, dispatch] = useReducer(reducer, initialState);

  let finalizedState = use(thenableState);

  let { cache, path } = finalizedState;

  if (!cache.has(path)) {
    // we got asked to render a path and we don't have a tree for it.
    dispatch({ type: "POPULATE", path });
  }

  useEffect(() => {
    fetchCache.clear();
    routerStateCache.clear();
  }, [finalizedState]);

  let returnedState = {
    path: finalizedState.path,
    action: finalizedState.action,
    history: finalizedState.history,
    tree: cache.get(path),
  };

  return [returnedState, dispatch] as const;
}

type NavigateAction = {
  type: "NAVIGATE";
  path: string;
  using: "push" | "replace";
  fetch: boolean;
};

type PopAction = {
  type: "POP";
  path: string;
};

type RefreshAction = {
  type: "REFRESH";
};

type PopulateAction = {
  type: "POPULATE";
  path: string;
};

type UpdateAction = {
  type: "UPDATE";
  path: string;
  tree: Tree;
  updateId: string;
};

type NotFoundAction = {
  type: "NOT_FOUND";
  path: string;
};

type Action =
  | NavigateAction
  | PopAction
  | RefreshAction
  | PopulateAction
  | UpdateAction
  | NotFoundAction;

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
            let rsc = await fetchRSCPayload(action.path, {
              initiator: "client-side-navigation",
            });

            path = rsc.path;
            newCache.set(rsc.path, rsc.tree);
          }

          return {
            path,
            action: "navigate",
            history: action.using,
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
            path: action.path,
            action: "popstate",
            history: "none",
            cache: previous.cache,
          };
        },
      });
    case "REFRESH":
      return createRouterState({
        cacheKey: `refresh`,
        async reduce() {
          let previous = await state;
          let rsc = await fetchRSCPayload(previous.path, {
            initiator: "refresh",
          });

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.tree);

          return {
            ...previous,
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
          let rsc = await fetchRSCPayload(action.path, {
            initiator: "populate",
          });

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.tree);

          return {
            ...previous,
            action: "none",
            history: "none",
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
          newCache.set(action.path, action.tree);

          return {
            path: previous.path,
            action: "refresh",
            history: "none",
            cache: newCache,
          };
        },
      });
    case "NOT_FOUND":
      return createRouterState({
        cacheKey: `not-found-${action.path}`,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);

          let rsc = await fetchRSCPayload(action.path, {
            resource: "not-found",
          });
          newCache.set(rsc.path, rsc.tree);

          return {
            path: rsc.path,
            action: "none",
            history: "none",
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

type RSCPayload = {
  path: string;
  tree: Tree;
};
let fetchCache = new Map<string, Promise<RSCPayload>>();

type FetchOptions = {
  initiator?: string;
  resource?: "page" | "not-found";
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
      let contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType === "text/x-component") {
          // there was an error, but we have a valid response, so we're
          // going to let that response render. most likely 4xx (error but renderable)
        } else if (contentType === "text/x-serialized-error") {
          let json = await response.json();
          let error = deserializeError(json);
          throw error;
        } else {
          throw new Error(response.statusText);
        }
      }

      if (contentType === "application/json") {
        let json = await response.json();
        if (json.type === "twofold-offsite-redirect") {
          // should we verify this is offsite?
          window.location.href = json.url;
        }
      }

      let url = new URL(response.url);
      let responsePath = url.searchParams.get("path");
      let fetchedPath = responsePath ?? decodeURIComponent(encodedPath);
      let tree =
        contentType === "text/x-component"
          ? createFromReadableStream(response.body, {
              callServer,
            })
          : { then() {} };

      return {
        path: fetchedPath,
        tree,
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
  let initialPath = `${location.pathname}${location.search}${location.hash}`;
  let cache = new Map<string, Tree>();
  let path = initialPath;

  if (window.initialRSC?.stream) {
    let tree = createFromReadableStream(window.initialRSC.stream, {
      callServer,
    });
    cache.set(initialPath, tree);
  } else {
    let rscPayload = await fetchRSCPayload(initialPath, {
      initiator: "initial-render",
    });
    cache.set(rscPayload.path, rscPayload.tree);
    path = rscPayload.path;
  }

  return {
    path,
    action: "none",
    history: "none",
    cache,
  } as const;
}
