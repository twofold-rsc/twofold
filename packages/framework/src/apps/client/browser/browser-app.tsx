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
    (toPath: string, options: { updateUrl: boolean } = { updateUrl: true }) => {
      let url = new URL(toPath, window.location.href);

      let pathname =
        url.pathname.length > 1 && url.pathname.endsWith("/")
          ? url.pathname.slice(0, -1)
          : url.pathname;

      let newPath = `${pathname}${url.search}${url.hash}`;

      startTransition(() => {
        // setNavType(options.updateUrl ? "navigate" : "replace");
        dispatch({ type: "NAVIGATE", path: newPath });
      });
    },
    [dispatch],
  );

  let replace = useCallback(
    (toPath: string) => {
      navigate(toPath, { updateUrl: false });
    },
    [navigate],
  );

  let refresh = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "REFRESH", path: routerState.path });
    });
  }, [dispatch, routerState.path]);

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
    if (routerState.type === "navigate") {
      console.log("adding history for", routerState.path);
      window.history.pushState({}, "", routerState.path);
      document.documentElement.scrollTop = 0;
    }
  }, [routerState.path, routerState.type]);

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
