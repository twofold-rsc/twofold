import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
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
        dispatch({
          type: "NAVIGATE",
          path: newPath,
          using: options.addHistory ? "push" : "replace",
          fetch: true,
        });
      });
    },
    [dispatch],
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
        dispatch({ type: "POP", path });
      });
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [dispatch]);

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
  }, [dispatch]);

  let url = new URL(routerState.path, origin);
  let path = url.pathname;

  return (
    <ErrorBoundary>
      <RoutingContext
        path={path}
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
