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
import { RoutingContext } from "../shared/routing-context";
import { MultipartStream } from "./multipart-stream";
import { ErrorBoundary } from "./error-boundary";
import { deserializeError } from "serialize-error";

declare global {
  interface Window {
    initialRSC?: {
      stream: ReadableStream<Uint8Array>;
    };
  }
}

let initialPath = `${location.pathname}${location.search}${location.hash}`;
let initialCache = new Map<string, any>();

async function callServer(id: string, args: any) {
  console.log("requesting action", id);

  let body = await encodeReply(args);
  let path = `${location.pathname}${location.search}${location.hash}`;

  let p = fetch("/__rsc", {
    method: "POST",
    headers: {
      Accept: "text/x-component",
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

  let jsonStream = new MultipartStream({
    contentType: "application/json",
    response,
  });

  let result = await jsonStream.value();
  let decoded = new TextDecoder("utf-8").decode(result);
  let json: JSON | undefined;
  if (decoded) {
    try {
      json = JSON.parse(decoded);
    } catch {
      console.log("failed to parse json", decoded);
    }
  }

  let rscStream = new MultipartStream({
    contentType: "text/x-component",
    response,
  });

  let rscTree = createFromReadableStream(rscStream.stream, {
    callServer,
  });

  bridge.update(path, rscTree);

  return json;
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

  let navigate = useCallback((path: string) => {
    let url = new URL(path, window.location.href);

    let pathname =
      url.pathname.length > 1 && url.pathname.endsWith("/")
        ? url.pathname.slice(0, -1)
        : url.pathname;

    let newPath = `${pathname}${url.search}${url.hash}`;

    startTransition(() => {
      setCache((c) => {
        let newCache = new Map(c);
        newCache.delete(path);
        return newCache;
      });
      setPath(newPath);
      setNavType("navigate");
      window.history.pushState({}, "", newPath);
    });
  }, []);

  let refresh = useCallback(() => {
    startTransition(() => {
      setCache(new Map());
    });
  }, []);

  useEffect(() => {
    function onPopState(_event: PopStateEvent) {
      startTransition(() => {
        let path = `${location.pathname}${location.search}${location.hash}`;
        setPath(path);
        setNavType("pop");
      });
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useLayoutEffect(() => {
    if (navType === "navigate") {
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

  if (!cache.has(path)) {
    let encodedUrl = encodeURIComponent(path);
    // console.log("fetching rsc payload from server for", path);
    let p = fetch(`/__rsc?path=${encodedUrl}`, {
      headers: {
        Accept: "text/x-component",
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
