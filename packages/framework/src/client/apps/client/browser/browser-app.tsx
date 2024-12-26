import {
  StrictMode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useTransition,
} from "react";
import { RoutingContext } from "../contexts/routing-context";
import { useRouterReducer } from "./router-hooks";
import { ErrorBoundary } from "../components/error-boundary";
import { CrashBoundary } from "../components/crash-boundary";

export function BrowserApp() {
  return (
    <CrashBoundary>
      <Router />
    </CrashBoundary>
  );
}

let origin = window.location.origin;

function Router() {
  let [routerState, dispatch] = useRouterReducer();
  let [optimisticPath, setOptimisticPath] = useOptimistic(routerState.path);
  let [isTransitioning, startTransition] = useTransition();

  let navigate = useCallback(
    (
      toPath: string,
      options: { addHistory: boolean } = { addHistory: true },
    ) => {
      let url = new URL(toPath, window.location.href);

      let pathname =
        url.pathname.length > 1 && url.pathname.endsWith("/")
          ? url.pathname.slice(0, -1)
          : url.pathname;

      let newPath = `${pathname}${url.search}${url.hash}`;

      startTransition(() => {
        setOptimisticPath(newPath);
        dispatch({
          type: "NAVIGATE",
          path: newPath,
          using: options.addHistory ? "push" : "replace",
          fetch: true,
        });
      });
    },
    [dispatch, setOptimisticPath],
  );

  let replace = useCallback(
    (toPath: string) => {
      navigate(toPath, { addHistory: false });
    },
    [navigate],
  );

  let refresh = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "REFRESH" });
    });
  }, [dispatch]);

  let notFound = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "NOT_FOUND", path: routerState.path });
    });
  }, [dispatch, routerState.path]);

  useEffect(() => {
    function onPopState(_event: PopStateEvent) {
      let path = `${location.pathname}${location.search}${location.hash}`;
      startTransition(() => {
        setOptimisticPath(path);
        dispatch({ type: "POP", path });
      });
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [dispatch, setOptimisticPath]);

  useLayoutEffect(() => {
    if (routerState.history === "push") {
      let current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      let isOnPath = current === routerState.path;
      if (!isOnPath) {
        window.history.pushState({}, "", routerState.path);
      }
      document.documentElement.scrollTop = 0;
    } else if (routerState.history === "replace") {
      window.history.replaceState({}, "", routerState.path);
      document.documentElement.scrollTop = 0;
    }
  }, [routerState.path, routerState.history]);

  useLayoutEffect(() => {
    let url = new URL(routerState.path, window.location.href);
    let hash = url.hash.slice(1);
    let action = routerState.action;
    let actionShouldScroll =
      action === "seed" || action === "navigate" || action === "popstate";

    if (actionShouldScroll && hash) {
      let element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [routerState.path, routerState.action]);

  useEffect(() => {
    window.__twofold = {
      updateTree(path: string, tree: any) {
        startTransition(() => {
          setOptimisticPath(path);
          dispatch({
            type: "UPDATE",
            path,
            tree,
            updateId: crypto.randomUUID(),
          });
        });
      },
      navigate(path: string) {
        startTransition(() => {
          setOptimisticPath(path);
          dispatch({
            type: "NAVIGATE",
            path,
            using: "push",
            fetch: false,
          });
        });
      },
    };

    return () => {
      window.__twofold = undefined;
    };
  }, [dispatch, setOptimisticPath]);

  let url = useURLFromPath(routerState.path);
  let optimisticURL = useURLFromPath(optimisticPath);

  // make sure search params and optimistic search params have identity when paths are the same
  let optimisticSearchParams =
    routerState.path === optimisticPath
      ? url.searchParams
      : optimisticURL.searchParams;

  return (
    <ErrorBoundary>
      <RoutingContext
        path={url.pathname}
        searchParams={url.searchParams}
        optimisticPath={optimisticURL.pathname}
        optimisticSearchParams={optimisticSearchParams}
        isTransitioning={isTransitioning}
        navigate={navigate}
        replace={replace}
        refresh={refresh}
        notFound={notFound}
      >
        {routerState.tree}
      </RoutingContext>
    </ErrorBoundary>
  );
}

/**
 * Turns a router path into a URL object.
 *
 * @param path Path is a Twofold router path: `/path?query#hash`.
 * @returns
 */
function useURLFromPath(path: string) {
  return useMemo(() => new URL(path, origin), [path]);
}
