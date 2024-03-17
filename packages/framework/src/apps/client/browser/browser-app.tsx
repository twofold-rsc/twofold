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
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { RoutingContext } from "../contexts/routing-context";
// import { MultipartStream } from "../actions/multipart-stream";
import { ErrorBoundary } from "../components/error-boundary";
// import { deserializeError } from "serialize-error";
import { useRouterReducer } from "./router-hooks";

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
// async function callServer(id: string, args: any) {
//   // console.log("requesting action", id);

//   let body = await encodeReply(args);
//   let path = `${location.pathname}${location.search}${location.hash}`;

//   let p = fetch("/__rsc/action", {
//     method: "POST",
//     headers: {
//       Accept: "text/x-component",
//       "x-twofold-initiator": "call-server",
//       "x-twofold-server-reference": id,
//       "x-twofold-path": path,
//     },
//     body,
//   });

//   let response = await p;

//   if (!response.ok) {
//     let contentType = response.headers.get("content-type");
//     if (contentType === "text/x-serialized-error") {
//       let json = await response.json();
//       let error = deserializeError(json);
//       throw error;
//     } else {
//       throw new Error(response.statusText);
//     }
//   }

//   let actionStream = new MultipartStream({
//     contentType: "text/x-component",
//     headers: {
//       "x-twofold-stream": "action",
//       "x-twofold-server-reference": id,
//     },
//     response,
//   });

//   let rscStream = new MultipartStream({
//     contentType: "text/x-component",
//     headers: {
//       "x-twofold-stream": "render",
//       "x-twofold-path": path,
//     },
//     response,
//   });

//   let rscTree = createFromReadableStream(rscStream.stream, {
//     callServer,
//   });

//   let actionTree = createFromReadableStream(actionStream.stream, {
//     callServer,
//   });

//   bridge.update(path, rscTree);

//   return actionTree;
// }

// if (window.initialRSC?.stream) {
//   let tree = createFromReadableStream(window.initialRSC.stream, {
//     callServer,
//   });
//   initialCache.set(initialPath, tree);
// }

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
  // let tree = null;
  // if (window.initialRSC?.stream) {
  // tree = createFromReadableStream(window.initialRSC.stream, {
  //   callServer,
  // });
  // initialCache.set(initialPath, tree);
  // }

  let [routerState, dispatch] = useRouterReducer();

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
        // setInitiator("client-side-navigation");
        // setNavType(options.updateUrl ? "navigate" : "replace");
        dispatch({ type: "NAVIGATE", path: newPath });
      });
    },
    [cache, dispatch],
  );

  let replace = useCallback(
    (toPath: string) => {
      navigate(toPath, { updateUrl: false });
    },
    [navigate],
  );

  // let refresh = useCallback(() => {
  //   startTransition(() => {
  //     setResourceType("page");
  //     setInitiator("refresh");
  //     setCache(new Map());
  //   });
  // }, []);
  let refresh = useCallback(() => {
    startTransition(() => {
      dispatch({ type: "REFRESH" });
    });
  }, [dispatch]);

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

  // useEffect(() => {
  //   function onPopState(_event: PopStateEvent) {
  //     startTransition(() => {
  //       let path = `${location.pathname}${location.search}${location.hash}`;
  //       setPath(path);
  //       setResourceType("page");
  //       setNavType("pop");
  //       setInitiator("popstate");
  //     });
  //   }

  //   window.addEventListener("popstate", onPopState);
  //   return () => {
  //     window.removeEventListener("popstate", onPopState);
  //   };
  // }, []);

  useEffect(() => {
    function onPopState(_event: PopStateEvent) {
      console.log("pop state fired!");
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

  // useLayoutEffect(() => {
  //   if (navType === "navigate") {
  //     console.log("adding history for", path);
  //     window.history.pushState({}, "", path);
  //     document.documentElement.scrollTop = 0;
  //   } else if (navType === "replace") {
  //     console.log("replacing history for", path);
  //     window.history.replaceState({}, "", path);
  //     document.documentElement.scrollTop = 0;
  //   }
  // }, [navType, path]);

  useLayoutEffect(() => {
    if (routerState.type === "navigate") {
      console.log("adding history for", routerState.path);
      window.history.pushState({}, "", routerState.path);
      document.documentElement.scrollTop = 0;
    }
  }, [routerState.path, routerState.type]);

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

    // window.callServer = callServer;

    return () => {
      bridge.update = () => {};
      // window.callServer = undefined;
    };
  }, []);

  // if (!cache.has(path)) {
  //   let encodedPath = encodeURIComponent(path);
  //   // console.log("fetching rsc payload from server for", path);
  //   let endpoint =
  //     resourceType === "page"
  //       ? `/__rsc/page?path=${encodedPath}`
  //       : `/__rsc/not-found?path=${encodedPath}`;

  //   let p = fetch(endpoint, {
  //     headers: {
  //       Accept: "text/x-component",
  //       "x-twofold-initiator": initiator,
  //     },
  //   })
  //     .then(async (response) => {
  //       if (!response.ok) {
  //         let contentType = response.headers.get("content-type");
  //         if (contentType === "text/x-component") {
  //           // there was an error, but we have a valid response, so we're
  //           // going to let that response render. most likely 404
  //         } else if (contentType === "text/x-serialized-error") {
  //           let json = await response.json();
  //           let error = deserializeError(json);
  //           // put into cache?
  //           throw error;
  //         } else {
  //           // put into cache?
  //           throw new Error(response.statusText);
  //         }
  //       }
  //       return response;
  //     })
  //     .then((response) => {
  //       let url = new URL(response.url);
  //       let encodedPath = url.searchParams.get("path");
  //       if (encodedPath) {
  //         let fetchedPath = decodeURIComponent(encodedPath);
  //         if (path !== fetchedPath) {
  //           // a redirect caused us to fetch another path, so we will
  //           // get the tree for the path we thought we were fetching,
  //           // and put it into the cache for the path we got redirected
  //           // to
  //           // console.log("fetched a redirect");
  //           // console.log({
  //           //   path: path,
  //           //   fetchedPath: fetchedPath,
  //           // });

  //           // legal sets here?
  //           setPath(fetchedPath);
  //           setCache((c) => {
  //             let newCache = new Map(c);
  //             if (newCache.has(path)) {
  //               let tree = newCache.get(path);
  //               newCache.set(fetchedPath, tree);
  //             }
  //             return newCache;
  //           });
  //         }
  //       }

  //       return response;
  //     });

  //   let lazyRoot = createFromFetch(p, {
  //     callServer,
  //   });

  //   cache.set(path, lazyRoot);
  // }

  // let serverOutput = cache.get(path);

  return (
    <RoutingContext
      path={path}
      navigate={navigate}
      replace={replace}
      refresh={refresh}
      notFound={notFound}
    >
      {routerState.tree}
      {/* {use(tree)} */}
      {/* {use(serverOutput)} */}
    </RoutingContext>
  );
}
