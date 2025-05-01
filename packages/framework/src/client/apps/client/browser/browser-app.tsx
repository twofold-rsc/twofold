import {
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

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    updateTree?: (path: string, tree: any) => void;
    navigate?: (path: string) => void;
    currentPath?: string;
  }
}

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

  let navigateToPath = useCallback(
    (
      toPath: string,
      options: {
        addHistory: boolean;
        scroll: boolean;
        mask?: string;
      },
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
          mask: options.mask,
          using: options.addHistory ? "push" : "replace",
          scroll: options.scroll ? "top" : "preserve",
          fetch: true,
        });
      });
    },
    [dispatch, setOptimisticPath],
  );

  let navigate = useCallback(
    (toPath: string, options: { scroll?: boolean; mask?: string } = {}) => {
      navigateToPath(toPath, {
        addHistory: true,
        scroll: options.scroll ?? true,
        mask: options.mask,
      });
    },
    [navigateToPath],
  );

  let replace = useCallback(
    (toPath: string, options: { scroll?: boolean; mask?: string } = {}) => {
      navigateToPath(toPath, {
        addHistory: false,
        scroll: options.scroll ?? true,
        mask: options.mask,
      });
    },
    [navigateToPath],
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
    function onPopState(event: PopStateEvent) {
      let path = event.state?.path
        ? event.state.path
        : `${location.pathname}${location.search}${location.hash}`;
      let mask = event.state?.mask ? event.state.mask : undefined;

      startTransition(() => {
        setOptimisticPath(path);
        dispatch({
          type: "POP",
          path,
          mask,
        });
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
      let display = routerState.mask ? routerState.mask : routerState.path;
      let isOnPath = current === display;
      if (!isOnPath) {
        window.history.pushState(
          {
            path: routerState.path,
            mask: routerState.mask,
          },
          "",
          display,
        );
      }
      if (routerState.scroll === "top") {
        document.documentElement.scrollTop = 0;
      }
    } else if (routerState.history === "replace") {
      let display = routerState.mask ? routerState.mask : routerState.path;
      window.history.replaceState(
        {
          path: routerState.path,
          mask: routerState.mask,
        },
        "",
        display,
      );
      if (routerState.scroll === "top") {
        document.documentElement.scrollTop = 0;
      }
    }
  }, [
    routerState.path,
    routerState.mask,
    routerState.history,
    routerState.scroll,
  ]);

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
    let url = new URL(routerState.path, window.location.href);
    let currentPath = `${url.pathname}${url.search}${url.hash}`;

    if (window.__twofold && window.__twofold.currentPath !== routerState.path) {
      window.__twofold.currentPath = currentPath;
    }
  }, [routerState.path]);

  useEffect(() => {
    function genUpdateId() {
      let random = Math.random().toString(36).slice(2, 18);
      return `${random}-${Date.now()}`;
    }

    window.__twofold = {
      ...window.__twofold,
      updateTree(path: string, tree: any) {
        startTransition(() => {
          setOptimisticPath(path);
          dispatch({
            type: "UPDATE",
            path,
            tree,
            updateId: genUpdateId(),
          });
        });
      },
      navigate(path: string) {
        startTransition(() => {
          setOptimisticPath(path);
          dispatch({
            type: "NAVIGATE",
            path,
            mask: undefined,
            using: "push",
            scroll: "top",
            fetch: false,
          });
        });
      },
    };

    return () => {
      if (window.__twofold) {
        delete window.__twofold.updateTree;
        delete window.__twofold.navigate;
      }
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
        mask={routerState.mask}
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
