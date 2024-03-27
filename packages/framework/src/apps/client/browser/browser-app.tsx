import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { RoutingContext } from "../contexts/routing-context";
import { ErrorBoundary } from "../components/error-boundary";
import { useRouterReducer } from "./router-hooks";

export function BrowserApp() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

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
      let isOnPath = window.location.pathname === routerState.path;
      if (!isOnPath) {
        window.history.pushState({}, "", routerState.path);
      }
      document.documentElement.scrollTop = 0;
    } else if (routerState.history === "replace") {
      window.history.replaceState({}, "", routerState.path);
      document.documentElement.scrollTop = 0;
    }
  }, [routerState.path, routerState.history]);

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

  return (
    <RoutingContext
      path={routerState.path}
      navigate={navigate}
      replace={replace}
      refresh={refresh}
      notFound={notFound}
    >
      {routerState.tree}
    </RoutingContext>
  );
}
