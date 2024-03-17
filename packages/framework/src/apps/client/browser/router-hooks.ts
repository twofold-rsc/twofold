import { startTransition, use, useEffect, useReducer } from "react";
import { deserializeError } from "serialize-error";
import {
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { callServer } from "../actions/call-server";

// not found
// replace
// router transitions examples

type Tree = any;

type State = {
  path: string;
  type: "initial" | "navigate" | "pop" | "replace";
  cache: Map<string, Tree>;
};

let initialState = getInitialRouterState();

export function useRouterReducer() {
  let [thenableState, dispatch] = useReducer(reducer, initialState);

  let finalizedState = use(thenableState);

  let { cache, path } = finalizedState;

  if (!cache.has(path)) {
    // we got asked to render a path and we don't have a tree for it.
    dispatch({ type: "REFRESH" });
  }

  useEffect(() => {
    console.log("finalized state changed");
    fetchCache.clear();
    routerStateCache.clear();
  }, [finalizedState]);

  useEffect(() => {
    window.__twofold = {
      callServer,
      updateTree(path: string, tree: Tree) {
        startTransition(() => {
          dispatch({ type: "UPDATE", path, tree });
        });
      },
    };

    return () => {
      window.__twofold = undefined;
    };
  }, []);

  let returnedState = {
    path: finalizedState.path,
    type: finalizedState.type,
    tree: cache.get(path),
  };

  return [returnedState, dispatch] as const;
}

type NavigateAction = {
  type: "NAVIGATE";
  path: string;
};

type PopAction = {
  type: "POP";
  path: string;
};

type RefreshAction = {
  type: "REFRESH";
};

type UpdateAction = {
  type: "UPDATE";
  path: string;
  tree: Tree;
};

type Action = NavigateAction | PopAction | RefreshAction | UpdateAction;

function reducer(state: Promise<State>, action: Action): Promise<State> {
  switch (action.type) {
    case "NAVIGATE":
      return createRouterState({
        cacheKey: `navigate-${action.path}`,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);
          let rsc = await fetchRSCPayload(action.path);

          newCache.set(rsc.path, rsc.tree);

          return {
            path: rsc.path,
            type: "navigate",
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
            type: "pop",
            cache: previous.cache,
          };
        },
      });
    case "REFRESH":
      return createRouterState({
        cacheKey: "refresh",
        async reduce() {
          let previous = await state;
          let rsc = await fetchRSCPayload(previous.path);

          let newCache = new Map(previous.cache);
          newCache.set(rsc.path, rsc.tree);

          return {
            ...previous,
            cache: newCache,
          };
        },
      });
    case "UPDATE":
      return createRouterState({
        cacheKey: `update-${action.path}`,
        async reduce() {
          let previous = await state;
          let newCache = new Map(previous.cache);
          newCache.set(action.path, action.tree);

          return {
            ...previous,
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

// this needs to be typed
function fetchRSCPayload(path: string) {
  // console.log("fetching rsc payload for", path);
  // make these args?
  let resourceType = "page";
  let initiator = "client-side-navigation";

  let encodedPath = encodeURIComponent(path);
  // console.log("fetching rsc payload from server for", path);
  let endpoint =
    resourceType === "page"
      ? `/__rsc/page?path=${encodedPath}`
      : `/__rsc/not-found?path=${encodedPath}`;

  // real cache keys: endpoint?
  let cacheKey = path;

  if (!fetchCache.has(cacheKey)) {
    let fetchPromise = fetch(endpoint, {
      headers: {
        Accept: "text/x-component",
        "x-twofold-initiator": initiator,
      },
    }).then(async (response) => {
      if (!response.ok) {
        let contentType = response.headers.get("content-type");
        if (contentType === "text/x-component") {
          // there was an error, but we have a valid response, so we're
          // going to let that response render. most likely 404
        } else if (contentType === "text/x-serialized-error") {
          let json = await response.json();
          let error = deserializeError(json);
          // put into cache?
          throw error;
        } else {
          // put into cache?
          throw new Error(response.statusText);
        }
      }

      let url = new URL(response.url);
      let responseEncodedPath = url.searchParams.get("path");
      let payloadEncodedPath = responseEncodedPath ?? encodedPath;
      let fetchedPath = decodeURIComponent(payloadEncodedPath);

      let tree = createFromReadableStream(response.body, {
        callServer,
      });

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

let initialPath = `${location.pathname}${location.search}${location.hash}`;
async function getInitialRouterState() {
  let cache = new Map<string, Tree>();

  if (window.initialRSC?.stream) {
    let tree = createFromReadableStream(window.initialRSC.stream, {
      callServer,
    });
    cache.set(initialPath, tree);

    return {
      path: initialPath,
      type: "initial",
      cache,
    } as const;
  } else {
    let { path, tree } = await fetchRSCPayload(initialPath);
    cache.set(path, tree);

    return {
      path,
      type: "initial",
      cache,
    } as const;
  }
}
