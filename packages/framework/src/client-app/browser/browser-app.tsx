import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";
import {
  encodeReply,
  createFromFetch,
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { RoutingContext } from "../contexts/routing-context";
import { MultipartStream } from "./multipart-stream";
import { ErrorBoundary } from "../components/error-boundary";
import { deserializeError } from "serialize-error";
import { MultipartStream2 } from "./multipart-stream2";

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
    callServer?: (id: string, args: any) => Promise<any>;
  }
}

let initialPath = `${location.pathname}${location.search}${location.hash}`;
let initialCache = new Map<string, any>();

async function callServer(id: string, args: any) {
  // console.log("requesting action", id);

  let body = await encodeReply(args);
  let path = `${location.pathname}${location.search}${location.hash}`;

  let p = fetch("/__rsc", {
    method: "POST",
    headers: {
      Accept: "text/x-component",
      "x-twofold-initiator": "call-server",
      "x-twofold-server-reference": id,
      "x-twofold-path": path,
    },
    body,
  });

  let response = await p;

  if (!response.ok) {
    let contentType = response.headers.get("content-type");
    if (contentType === "text/x-serialized-error") {
      let json = await response.json();
      let error = deserializeError(json);
      throw error;
    } else {
      throw new Error(response.statusText);
    }
  }

  let actionStream = new MultipartStream2({
    contentType: "text/x-component",
    headers: {
      "x-twofold-server-reference": id,
    },
    response,
  });

  let rscStream = new MultipartStream2({
    contentType: "text/x-component",
    headers: {
      "x-twofold-path": path,
    },
    response,
  });

  let rscTree = createFromReadableStream(rscStream.stream, {
    callServer,
  });

  let actionTree = createFromReadableStream(actionStream.stream, {
    callServer,
  });

  bridge.update(path, rscTree);

  return actionTree;
}

if (window.initialRSC?.stream) {
  let tree = createFromReadableStream(window.initialRSC.stream, {
    callServer,
  });
  initialCache.set(initialPath, tree);
}

type Bridge = {
  update(path: string, lazy: any): void | never;
};

let bridge: Bridge = {
  update(path: string, lazy: any) {
    throw new Error("Bridge has not yet been setup");
  },
};

export function BrowserApp() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

function Router() {
  let [path, setPath] = useState(initialPath);
  let [navType, setNavType] = useState<string>();
  let [cache, setCache] = useState(initialCache);
  let [isPending, startTransition] = useTransition();

  // Whenever we are transitioning into a new route state we set how we
  // initiated it here. We might be doing a client side nav, a refresh,
  // a dev reload, or something else.
  let [initiator, setInitiator] = useState<string>("initial-render");

  let navigate = useCallback(
    (toPath: string) => {
      let url = new URL(toPath, window.location.href);

      let pathname =
        url.pathname.length > 1 && url.pathname.endsWith("/")
          ? url.pathname.slice(0, -1)
          : url.pathname;

      let newPath = `${pathname}${url.search}${url.hash}`;
      let newCache = new Map(cache);
      newCache.delete(toPath);

      startTransition(() => {
        setCache(newCache);
        setPath(newPath);
        setNavType("navigate");
        setInitiator("client-side-navigation");
      });
    },
    [cache],
  );

  let refresh = useCallback(() => {
    startTransition(() => {
      setInitiator("refresh");
      setCache(new Map());
    });
  }, []);

  useEffect(() => {
    function onPopState(_event: PopStateEvent) {
      startTransition(() => {
        let path = `${location.pathname}${location.search}${location.hash}`;
        setPath(path);
        setNavType("pop");
        setInitiator("popstate");
      });
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    if (navType === "navigate") {
      window.history.pushState({}, "", path);
      document.documentElement.scrollTop = 0;
    }
  }, [navType, path]);

  useEffect(() => {
    bridge.update = (path: string, lazy: any) => {
      startTransition(() => {
        setCache((c) => {
          let newCache = new Map(c);
          newCache.set(path, lazy);
          return newCache;
        });
      });
    };

    return () => {
      bridge.update = () => {};
    };
  }, []);

  useEffect(() => {
    window.callServer = callServer;
    return () => {
      window.callServer = undefined;
    };
  });

  if (!cache.has(path)) {
    let encodedUrl = encodeURIComponent(path);
    // console.log("fetching rsc payload from server for", path);
    let p = fetch(`/__rsc?path=${encodedUrl}`, {
      headers: {
        Accept: "text/x-component",
        "x-twofold-initiator": initiator,
      },
    }).then(async (response) => {
      if (!response.ok) {
        let contentType = response.headers.get("content-type");
        if (contentType === "text/x-serialized-error") {
          let json = await response.json();
          let error = deserializeError(json);
          throw error;
        } else {
          throw new Error(response.statusText);
        }
      }
      return response;
    });

    let lazyRoot = createFromFetch(p, {
      callServer,
    });

    cache.set(path, lazyRoot);
  }

  let serverOutput = cache.get(path);

  return (
    <RoutingContext path={path} navigate={navigate} refresh={refresh}>
      {use(serverOutput)}
    </RoutingContext>
  );
}
