import "./monkey-patch.js";
import { createServer } from "@hattip/adapter-node";
import { parseHeaderValue } from "@hattip/headers";
import { createRouter } from "@hattip/router";
import {
  renderToReadableStream,
  decodeReply,
  // @ts-ignore
} from "react-server-dom-webpack/server.edge";
import { getStore } from "./stores/rsc-store.js";
import { cookie } from "@hattip/cookie";
import { MultipartResponse } from "./multipart-response.js";
import { devReload } from "./server/middlewares/dev-reload.js";
import { Runtime } from "./runtime.js";
import { errors } from "./server/middlewares/errors.js";
import { staticFiles } from "./server/middlewares/static-files.js";
import { assets } from "./server/middlewares/assets.js";
import { pathNormalization } from "./server/middlewares/path-normalization.js";
import { session } from "./server/middlewares/session.js";
import { globalMiddleware } from "./server/middlewares/global-middleware.js";
import { requestStore } from "./server/middlewares/request-store.js";

export async function create(runtime: Runtime) {
  let build = runtime.build;

  let app = createRouter();

  app.use(pathNormalization());

  app.use(cookie());
  app.use(await session());

  app.use(globalMiddleware(build));
  app.use(assets(build));
  app.use(staticFiles(build));
  app.use(devReload(build));
  app.use(errors(build));

  // every request below here should use the store
  app.use(requestStore());

  app.get("/__rsc/page", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.rscResponse();

    let initiator = ctx.request.headers.get("x-twofold-initiator");

    if (response.status === 404) {
      console.log("🔴 Not found", requestUrl.pathname);
    } else if (response.status === 307) {
      let location = response.headers.get("location");
      console.log("🔵 Redirecting to", location);
    } else if (initiator === "refresh") {
      console.log("🔵 Refreshing", requestUrl.pathname);
    } else if (initiator === "client-side-navigation") {
      console.log("🟢 Rendering", requestUrl.pathname);
    }

    return response;
  });

  app.get("/__rsc/not-found", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = runtime.notFoundPageRequest(request);
    let response = await pageRequest.rscResponse();

    return response;
  });

  app.post("/__rsc/action", async (ctx) => {
    let serverReference = ctx.request.headers.get("x-twofold-server-reference");
    if (!serverReference) {
      throw new Error("No server action specified");
    }

    if (!runtime.isAction(serverReference)) {
      throw new Error("Server action not found");
    }

    let path = ctx.request.headers.get("x-twofold-path");
    if (!path) {
      throw new Error("No path specified");
    }

    let url = new URL(ctx.request.url);
    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let pageRequest = runtime.pageRequest(request);

    let args = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (contentType.value === "text/plain") {
      let text = await request.text();
      args = await decodeReply(text);
    } else if (contentType.value === "multipart/form-data") {
      let formData = await request.formData();
      args = await decodeReply(formData);
    }

    let [, name] = serverReference.split("#");
    console.log(`🟣 Running action ${name}`);

    let result = await runtime.runAction(serverReference, args);
    let actionStream = renderToReadableStream(
      result,
      build.builders.client.clientComponentMap,
    );

    let multipart = new MultipartResponse();

    multipart.add({
      type: "text/x-component",
      body: actionStream,
      headers: {
        "x-twofold-stream": "action",
        "x-twofold-server-reference": serverReference,
      },
    });

    let store = getStore();
    if (store) {
      console.log(ctx.outgoingCookies);
      store.cookies.outgoingCookies = ctx.outgoingCookies;
    }

    // start render

    let rscPageResponse = await pageRequest.rscResponse();

    multipart.add({
      type: "text/x-component",
      body: rscPageResponse.body,
      headers: {
        "x-twofold-stream": "render",
        "x-twofold-path": path,
      },
    });

    return multipart.response();
  });

  app.get("/**/*", async (ctx) => {
    let url = new URL(ctx.request.url);
    let request = ctx.request;
    let pageRequest = runtime.pageRequest(request);
    let response = await pageRequest.ssrResponse();

    if (response.status === 404) {
      console.log("🔴 Not found", url.pathname);
    } else if (response.status === 307) {
      console.log("🔵 Redirecting to", response.headers.get("location"));
    } else {
      console.log("🟢 Serving", url.pathname);
    }

    return response;
  });

  return {
    async start() {
      let r: () => void = () => {};
      let promise = new Promise<void>((resolve) => (r = resolve));

      createServer(app.buildHandler()).listen(
        runtime.port,
        runtime.hostname,
        () => {
          console.log(`🚀 Server listening on ${runtime.baseUrl}/`);
          r();
        },
      );

      return promise;
    },
  };
}
