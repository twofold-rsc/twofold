import {
  Component,
  startTransition,
  StrictMode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useTransition,
} from "react";
import { RoutingContext } from "../../../client/apps/client/contexts/routing-context.js";
import { useRouterReducer } from "./browser/router-hooks.js";
import { ErrorBoundary } from "../../../client/apps/client/components/error-boundary.js";
import { CrashBoundary } from "../../../client/apps/client/components/crash-boundary.js";
import {
  RouteStack,
  RouteStackEntry,
} from "../../../client/apps/client/contexts/route-stack-context.js";
import { hydrateRoot } from "react-dom/client";
import { setServerCallback } from "@vitejs/plugin-rsc/browser";
import { callServer } from "./browser/call-server.js";
import { getInitialPayload } from "./browser/initial-payload.js";

declare global {
  interface Window {
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    updateStack?: (path: string, stack: RouteStackEntry[]) => void;
    navigate?: (path: string) => void;
    currentPath?: string;
  }
}

function BrowserApp() {
  return (
    <CrashBoundary>
      <Router />
    </CrashBoundary>
  );
}

let origin = typeof window !== "undefined" ? window.location.origin : "";

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
        mask?: string | undefined;
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

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      let path = event.state?.path
        ? event.state.path
        : `${location.pathname}${location.search}${location.hash}`;
      let mask = event.state?.mask ? event.state.mask : undefined;

      // don't transition here because we want this to instantly paint
      dispatch({
        type: "POP",
        path,
        mask,
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
      updateStack(path: string, stack: RouteStackEntry[]) {
        startTransition(() => {
          setOptimisticPath(path);
          dispatch({
            type: "UPDATE",
            path,
            stack,
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
        delete window.__twofold.updateStack;
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

  let stack = routerState.stack ?? [];

  return (
    <ErrorBoundary>
      <RoutingContext
        version={routerState.version}
        path={url.pathname}
        mask={routerState.mask}
        searchParams={url.searchParams}
        optimisticPath={optimisticURL.pathname}
        optimisticSearchParams={optimisticSearchParams}
        isTransitioning={isTransitioning}
        navigate={navigate}
        replace={replace}
        refresh={refresh}
      >
        <RouteStack stack={stack} />
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

async function main() {
  let tree = (
    <StrictMode>
      <BrowserApp />
    </StrictMode>
  );

  setServerCallback(callServer);

  const initialPayload = await getInitialPayload();
  startTransition(() => {
    hydrateRoot(document, tree, {
      onCaughtError,
      formState: initialPayload.formState,
    });
  });
}

main();

type ErrorInfo = {
  componentStack?: string | undefined;
  errorBoundary?: Component<unknown, object, any> | undefined;
};

function onCaughtError(error: unknown, errorInfo: ErrorInfo) {
  let isSafeError =
    isRedirectError(error) ||
    isNotFoundError(error) ||
    isUnauthorizedError(error);

  if (!isSafeError && process.env.NODE_ENV !== "production") {
    // Let's redisplay the normal react error message here.
    //
    // This is taken from: https://github.com/facebook/react/blob/65eec428c40d542d4d5a9c1af5c3f406aecf3440/packages/react-reconciler/src/ReactFiberErrorLogger.js#L60

    // let stack = errorInfo.componentStack ?? "";
    let errorBoundaryName = errorInfo.errorBoundary?.constructor.name;

    console.error(
      "%o\n\n%s",
      error,
      errorBoundaryName
        ? `The error was handled by the ${errorBoundaryName} error boundary.`
        : "The error was caught by React",
    );
  }
}

function isNotFoundError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest === "TwofoldNotFoundError"
  );
}

function isRedirectError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldRedirectError")
  );
}

function isUnauthorizedError(err: unknown) {
  return (
    err instanceof Error &&
    "digest" in err &&
    typeof err.digest === "string" &&
    err.digest.startsWith("TwofoldUnauthorizedError")
  );
}
