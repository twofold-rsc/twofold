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
  let isMultipart =
    typeof contentType === "string" &&
    contentType.split(";")[0] === "multipart/mixed";

  let rscStream;
  let actionStream;

  if (contentType === "text/x-component") {
    rscStream = response.body;
  } else if (contentType === "text/x-serialized-error") {
    let json = await response.json();
    let error = deserializeError(json);
    actionStream = new ReadableStream({
      start(controller) {
        controller.error(error);
      },
    });
  } else if (contentType === "application/json") {
    let json = await response.json();
    if (json.type === "twofold-offsite-redirect") {
      window.location.href = json.url;
    }
  } else if (isMultipart) {
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
  } else if (!response.ok) {
    let error = new Error(response.statusText);
    actionStream = new ReadableStream({
      start(controller) {
        controller.error(error);
      },
    });
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
