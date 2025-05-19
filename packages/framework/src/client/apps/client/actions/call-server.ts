import { startTransition } from "react";
import {
  encodeReply,
  createFromReadableStream,
  createTemporaryReferenceSet,
  // @ts-expect-error: Could not find a declaration file for module 'react-server-dom-webpack/client'.
} from "react-server-dom-webpack/client";
import { deserializeError } from "serialize-error";

declare global {
  interface Window {
    __twofold?: WindowTwofold | undefined;
  }

  interface WindowTwofold {
    currentPath?: string;
  }
}

export function callServer(id: string, args: any) {
  return new Promise((resolve, reject) => {
    startTransition(async () => {
      // console.log("callServer", id, args);
      let temporaryReferences = createTemporaryReferenceSet();

      let body = await encodeReply(args, {
        temporaryReferences: temporaryReferences,
      });

      let browserPath = `${location.pathname}${location.search}${location.hash}`;
      let twofoldPath = window.__twofold?.currentPath;

      let path = twofoldPath ?? browserPath;
      let encodedPath = encodeURIComponent(path);
      let encodedId = encodeURIComponent(id);

      let p = fetch(`/__rsc/action/${encodedId}?path=${encodedPath}`, {
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
      let contentType = response.headers.get("content-type");

      let rscTree;
      let result;

      if (contentType === "text/x-component") {
        let streams = await createFromReadableStream(response.body, {
          callServer,
          temporaryReferences,
        });
        rscTree = streams.tree;
        result = streams.action;
      } else if (contentType === "text/x-serialized-error") {
        let json = await response.json();
        let error = deserializeError(json);
        let stream = new ReadableStream({
          start(controller) {
            controller.error(error);
          },
        });
        result = createFromReadableStream(stream, {
          callServer,
        });
        // should we reject here?
        // reject(error);
      } else if (contentType === "application/json") {
        let json = await response.json();
        if (json.type === "twofold-offsite-redirect") {
          window.location.href = json.url;
        }
      } else if (!response.ok) {
        let error = new Error(response.statusText);
        let stream = new ReadableStream({
          start(controller) {
            controller.error(error);
          },
        });
        result = createFromReadableStream(stream, {
          callServer,
        });
      }

      if (rscTree) {
        let url = new URL(response.url);
        let receivedPath = url.searchParams.get("path");
        let pathToUpdate =
          response.redirected && receivedPath ? receivedPath : path;

        if (window.__twofold?.updateTree) {
          window.__twofold.updateTree(pathToUpdate, rscTree);
        }

        if (response.redirected && window.__twofold?.navigate) {
          window.__twofold.navigate(pathToUpdate);
        }
      }

      resolve(result);
    });
  });
}
