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

// move to another file
async function callServer(id: string, args: any) {
  // console.log("requesting action", id);

  let body = await encodeReply(args);
  let path = `${location.pathname}${location.search}${location.hash}`;

  let p = fetch("/__rsc/action", {
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

  let actionStream = new MultipartStream({
    contentType: "text/x-component",
    headers: {
      "x-twofold-stream": "action",
      "x-twofold-server-reference": id,
    },
    response,
  });

  let rscStream = new MultipartStream({
    contentType: "text/x-component",
    headers: {
      "x-twofold-stream": "render",
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
  // this should all be a reducer, im just making a mess here!

  let [path, setPath] = useState(initialPath);
  let [navType, setNavType] = useState<string>();
  let [cache, setCache] = useState(initialCache);

  // Whenever we are transitioning into a new route state we set how we
  // initiated it here. We might be doing a client side nav, a refresh,
  // a dev reload, or something else.
  let [initiator, setInitiator] = useState<string>("initial-render");

  // when we're requesting an RSC, what resource endpoint do we want
  // to fetch from.
  let [resourceType, setResourceType] = useState<"page" | "not-found">("page");

  let [isPending, startTransition] = useTransition();

  let navigate = useCallback(
    (toPath: string, options: { updateUrl: boolean } = { updateUrl: true }) => {
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
        setResourceType("page");
        setPath(newPath);
        setNavType(options.updateUrl ? "navigate" : "replace");
        setInitiator("client-side-navigation");
      });
    },
    [cache],
  );

  let replace = useCallback(
    (toPath: string) => {
      navigate(toPath, { updateUrl: false });
    },
    [navigate],
  );

  let refresh = useCallback(() => {
    startTransition(() => {
      setResourceType("page");
      setInitiator("refresh");
      setCache(new Map());
    });
  }, []);

  // replaces the current cache entry with the not found
  // page
  let notFound = useCallback(() => {
    let newCache = new Map(cache);
    newCache.delete(path);

    startTransition(() => {
      setCache(newCache);
      setResourceType("not-found");
      setNavType("replace");
      setInitiator("refresh");
    });
  }, [cache, path]);

  useEffect(() => {
    function onPopState(_event: PopStateEvent) {
      startTransition(() => {
        let path = `${location.pathname}${location.search}${location.hash}`;
        setPath(path);
        setResourceType("page");
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
    } else if (navType === "replace") {
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

    window.callServer = callServer;

    return () => {
      bridge.update = () => {};
      window.callServer = undefined;
    };
  }, []);

  if (!cache.has(path)) {
    let encodedUrl = encodeURIComponent(path);
    // console.log("fetching rsc payload from server for", path);
    let endpoint =
      resourceType === "page"
        ? `/__rsc/page?path=${encodedUrl}`
        : `/__rsc/not-found?path=${encodedUrl}`;

    let p = fetch(endpoint, {
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
      return response;
    });

    let lazyRoot = createFromFetch(p, {
      callServer,
    });

    cache.set(path, lazyRoot);
  }

  let serverOutput = cache.get(path);

  return (
    <RoutingContext
      path={path}
      navigate={navigate}
      replace={replace}
      refresh={refresh}
      notFound={notFound}
    >
      {use(serverOutput)}
    </RoutingContext>
  );
}
