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
import {
  isNotFoundError,
  isRedirectError,
  redirectErrorInfo,
} from "./runtime/helpers/errors.js";

export async function create(runtime: Runtime) {
  let build = runtime.build;

  let app = createRouter();

  app.use(pathNormalization());

  app.use(cookie());
  app.use(await session());

  app.use(globalMiddleware(build));
  app.use(assets(build));
  app.use(staticFiles(build));

  if (build.env === "development") {
    app.use(devReload(build));
  }

  app.use(errors(build));

  // every request below here should use the store
  app.use(requestStore(build));

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
      let location = response.headers.get("location")?.split("?")[1];
      let params = new URLSearchParams(location ?? "");
      console.log("🔵 Redirecting to", params.get("path"));
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

  app.post("/__rsc/action/:id", async (ctx) => {
    // this whole function should be moved into the runtime, but im going to leave it here for now
    let request = ctx.request;
    let params = ctx.params as Record<string, unknown>;

    if (!params.id || typeof params.id !== "string") {
      throw new Error("No server action specified");
    }

    let id = decodeURIComponent(params.id);

    let url = new URL(request.url);
    let path = url.searchParams.get("path");

    if (!path) {
      throw new Error("No path specified");
    }

    let args = [];
    let [contentType] = parseHeaderValue(request.headers.get("content-type"));

    if (contentType.value === "text/plain") {
      let text = await request.text();
      args = await decodeReply(text);
    } else if (contentType.value === "multipart/form-data") {
      let formData = await request.formData();
      args = await decodeReply(formData);
    }

    let actionFn = await runtime.getAction(id);

    let [, name] = id.split("#");
    console.log(`🟣 Running action ${name}`);

    let result;
    try {
      result = await actionFn.apply(null, args);
    } catch (err: unknown) {
      if (isNotFoundError(err) || isRedirectError(err)) {
        result = err;
      } else {
        // rethrow
        throw err;
      }
    }

    // action is done running, get any cookies it set back into
    // the store
    let store = getStore();
    if (store) {
      store.cookies.outgoingCookies = ctx.outgoingCookies;
    }

    // meh
    let requestUrl = new URL(path, url);
    let requestToRender = new Request(requestUrl, {
      ...ctx.request,
      method: "GET",
      body: null,
    });

    if (isNotFoundError(result)) {
      console.log(`🔴 Action ${name} called notFound`);
      let pageRequest = runtime.notFoundPageRequest(requestToRender);
      return pageRequest.rscResponse();
    }

    if (isRedirectError(result)) {
      let { url } = redirectErrorInfo(result);
      let redirectUrl = new URL(url, request.url);
      let isRelative =
        redirectUrl.origin === requestUrl.origin && url.startsWith("/");

      if (isRelative) {
        let redirectRequest = new Request(redirectUrl, requestToRender);
        let redirectPageRequest = runtime.pageRequest(redirectRequest);

        let encodedPath = encodeURIComponent(redirectUrl.pathname);
        let resource = redirectPageRequest.isNotFound ? "not-found" : "page";
        let newUrl = `/__rsc/${resource}?path=${encodedPath}`;

        console.log("🔵 Redirecting to", redirectUrl.pathname);

        return new Response(null, {
          status: 303,
          headers: {
            location: newUrl,
          },
        });
      }

      // we could not return a redirect to a page with an rsc payload, so lets
      // let the action on the browser know it needs to handle this redirect
      let payload = JSON.stringify({
        type: "twofold-offsite-redirect",
        url,
      });

      return new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    // couldn't this be a tree that throws something?
    let actionStream = renderToReadableStream(
      result,
      build.getBuilder("client").clientComponentMap,
    );

    let multipart = new MultipartResponse();

    multipart.add({
      type: "text/x-action",
      body: actionStream,
      headers: {
        "x-twofold-stream": "action",
        "x-twofold-server-reference": id,
      },
    });

    let pageRequest = runtime.pageRequest(requestToRender);
    let pageResponse = await pageRequest.rscResponse();

    multipart.add({
      type: "text/x-component",
      body: pageResponse.body,
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
