import {
  encodeReply,
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { deserializeError } from "serialize-error";
import { MultipartResponse } from "./multipart-response";

export async function callServer(id: string, args: any) {
  // console.log("requesting action", id);

  let body = await encodeReply(args);
  let path = `${location.pathname}${location.search}${location.hash}`;
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

  if (!response.ok) {
    if (contentType === "text/x-component") {
      // error response, but we have something we can render.
      // most likely a 4xx page came back from our action.
    } else if (contentType === "text/x-serialized-error") {
      let json = await response.json();
      let error = deserializeError(json);
      throw error;
    } else {
      throw new Error(response.statusText);
    }
  }

  let isMultipart =
    typeof contentType === "string" &&
    contentType.split(";")[0] === "multipart/mixed";

  let rscStream;
  let actionStream;
  if (contentType === "text/x-component") {
    // single response is a page that we can render
    rscStream = response.body;
  } else if (isMultipart) {
    // multiple responses to this action
    let actionResponse = new MultipartResponse({
      contentType: "text/x-action",
      response,
    });

    let rscResponse = new MultipartResponse({
      contentType: "text/x-component",
      response,
    });

    rscStream = rscResponse.stream;
    actionStream = actionResponse.stream;
  } else if (contentType === "application/json") {
    let json = await response.json();
    if (json.type === "twofold-offsite-redirect") {
      window.location.href = json.url;
    }
  }

  if (rscStream) {
    let url = new URL(response.url);
    let receivedPath = url.searchParams.get("path");
    let pathToUpdate =
      response.redirected && receivedPath ? receivedPath : path;

    let rscTree = createFromReadableStream(rscStream, {
      callServer,
    });

    if (window.__twofold?.updateTree) {
      window.__twofold.updateTree(pathToUpdate, rscTree);
    }

    if (response.redirected && window.__twofold?.navigate) {
      window.__twofold.navigate(pathToUpdate);
    }
  }

  if (actionStream) {
    let actionTree = createFromReadableStream(actionStream, {
      callServer,
    });

    return actionTree;
  }
}
