import "./monkey-patch.js";
import { createServer } from "@hattip/adapter-node";
import { parseHeaderValue } from "@hattip/headers";
import { createRouter } from "@hattip/router";
import {
  renderToReadableStream,
  decodeReply,
  // @ts-ignore
} from "react-server-dom-webpack/server.edge";
import { getStore, runStore } from "./stores/rsc-store.js";
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

  app.get("/__rsc", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);
    let page = runtime.pageForRequest(request);

    let initiator = ctx.request.headers.get("x-twofold-initiator");

    if (page.isNotFound) {
      console.log("🔴 Not found", requestUrl.pathname);
    } else if (initiator === "refresh") {
      console.log("🔵 Refreshing", requestUrl.pathname);
    } else if (initiator === "client-side-navigation") {
      console.log("🟢 Rendering", requestUrl.pathname);
    }

    let stream = await page.rscStream();

    return new Response(stream, {
      status: page.isNotFound ? 404 : 200,
      headers: { "Content-type": "text/x-component" },
    });
  });

  app.post("/__rsc", async (ctx) => {
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
    let page = runtime.pageForRequest(request);

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
      store.cookies.outgoingCookies = ctx.outgoingCookies;
    }

    // start render

    let rscStream = await page.rscStream();

    multipart.add({
      type: "text/x-component",
      body: rscStream,
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
    let page = runtime.pageForRequest(request);

    if (!page.isNotFound) {
      console.log("🟢 Serving", url.pathname);
    } else {
      console.log("🔴 Not found", url.pathname);
    }

    let stream = await page.ssrStream();

    console.log("responding...");
    return new Response(stream, {
      status: page.isNotFound ? 404 : 200,
      headers: { "Content-type": "text/html" },
    });
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
