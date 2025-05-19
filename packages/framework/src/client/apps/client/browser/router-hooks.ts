import { use, useEffect, useReducer } from "react";
import { deserializeError } from "serialize-error";
import {
  createFromReadableStream,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client'.
} from "react-server-dom-webpack/client";
import { callServer } from "../actions/call-server";

type Tree = any;

type State = {
  path: string;
  mask: string | undefined;
  action: "seed" | "render" | "refresh" | "navigate" | "popstate";
  history: "none" | "push" | "replace";
  scroll: "top" | "preserve";
  cache: Map<string, Tree>;
};

let fetchCache = new Map<string, Promise<RSCPayload>>();
let initialState = getInitialRouterState();

export function useRouterReducer() {
  let [thenableState, dispatch] = useReducer(reducer, initialState);
  let finalizedState = use(thenableState);

  let { cache, mask, path } = finalizedState;

  if (!cache.has(path)) {
    // we got asked to render a path and we don't have a tree for it.
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
    path: finalizedState.path,
    mask: finalizedState.mask,
    action: finalizedState.action,
    history: finalizedState.history,
    scroll: finalizedState.scroll,
    tree: cache.get(path),
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
  | RenderAction
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
            ...previous,
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
            path: action.path,
            mask: action.mask,
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

          if (action.path !== rsc.path) {
            // we're trying to populate action.path, but the rsc fetch is
            // is giving us a tree for a different path. this is likely
            // because of a redirect.
            //
            // we need to fulfill the populate request, so we're also
            // going to store the tree in the path we were asked to
            // populate.
            //
            // longer term: this should really put in some sort of stub that
            // says action.path should redirect to rsc.path.
            newCache.set(action.path, rsc.tree);
          }

          return {
            ...previous,
            cache: newCache,
          };
        },
      });
    case "RENDER":
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
          newCache.set(action.path, action.tree);

          return {
            ...previous,
            action: "refresh",
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
            ...previous,
            path: rsc.path,
            action: "render",
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
      let url = new URL(response.url);
      let responsePath = url.searchParams.get("path");
      let contentType = response.headers.get("content-type");
      let fetchedPath = responsePath ?? decodeURIComponent(encodedPath);
      let rscOptions = { callServer };
      let tree;

      if (contentType === "text/x-component") {
        let payload = await createFromReadableStream(response.body, rscOptions);
        tree = payload.tree;
      } else if (contentType === "text/x-serialized-error") {
        let json = await response.json();
        let error = deserializeError(json);
        let stream = new ReadableStream({
          start(controller) {
            controller.error(error);
          },
        });
        tree = createFromReadableStream(stream, rscOptions);
      } else if (contentType === "application/json") {
        let json = await response.json();
        if (json.type === "twofold-offsite-redirect") {
          window.location.href = json.url;
          tree = { then: () => {} };
        } else {
          let stream = new ReadableStream({
            start(controller) {
              let error = new Error("Unexpected response");
              controller.error(error);
            },
          });
          tree = createFromReadableStream(stream, rscOptions);
        }
      } else if (!response.ok) {
        let stream = new ReadableStream({
          start(controller) {
            let error = new Error(response.statusText);
            controller.error(error);
          },
        });

        tree = createFromReadableStream(stream, rscOptions);
      } else {
        let stream = new ReadableStream({
          start(controller) {
            let error = new Error("Unexpected response");
            controller.error(error);
          },
        });
        tree = createFromReadableStream(stream, rscOptions);
      }

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
    let payload = await createFromReadableStream(window.initialRSC.stream, {
      callServer,
    });
    cache.set(initialPath, payload.tree);
  } else {
    let rscPayload = await fetchRSCPayload(initialPath, {
      initiator: "initial-render",
    });
    cache.set(rscPayload.path, rscPayload.tree);
    path = rscPayload.path;
  }

  let state: State = {
    path,
    mask: undefined,
    action: "seed",
    history: "none",
    scroll: "preserve",
    cache,
  };

  return state;
}
