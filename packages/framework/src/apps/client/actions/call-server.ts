import {
  encodeReply,
  createFromReadableStream,
  // @ts-expect-error
} from "react-server-dom-webpack/client";
import { deserializeError } from "serialize-error";
import { MultipartStream } from "./multipart-stream";

export async function callServer(id: string, args: any) {
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

  if (window.__twofold?.updateTree) {
    window.__twofold.updateTree(path, rscTree);
  }

  return actionTree;
}
