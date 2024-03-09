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
import { Build } from "./build.js";
import { CookieSerializeOptions, cookie } from "@hattip/cookie";
import { SignedCookieStore, session } from "@hattip/session";
import { MultipartResponse } from "./multipart-response.js";
import { devReload } from "./server/middlewares/dev-reload.js";
import { Runtime } from "./runtime.js";
import { errors } from "./server/middlewares/errors.js";
import { staticFiles } from "./server/middlewares/static-files.js";
import { assets } from "./server/middlewares/assets.js";

export async function makeServer(build: Build) {
  let runtime = new Runtime(build);

  let app = createRouter();

  app.use(async (ctx) => {
    let url = new URL(ctx.request.url);
    if (url.pathname.endsWith("/") && url.pathname !== "/") {
      return new Response(null, {
        status: 307,
        headers: {
          Location: url.pathname.slice(0, -1),
        },
      });
    }
  });

  let cookieSecret = "secret";
  app.use(cookie());
  app.use(
    session({
      cookieName: "_twofold-session",
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
      store: new SignedCookieStore(
        await SignedCookieStore.generateKeysFromSecrets([cookieSecret]),
      ),
      defaultSessionData: {},
    }),
  );

  app.use(async (ctx) => {
    let hasMiddleware = await build.builders.rsc.hasMiddleware();
    if (hasMiddleware) {
      let module = await import(build.builders.rsc.middlewarePath);
      let ans = await module.default(ctx.request);
      return ans;
    }
  });

  app.use(assets(build));
  app.use(staticFiles(build));
  app.use(devReload(build));
  app.use(errors(build));

  // every request below here should use the store
  let reqId = 0;

  app.use(async (ctx) => {
    reqId = reqId + 1;

    let store = {
      reqId,
      cookies: {
        set: (key: string, value: string, options: CookieSerializeOptions) => {
          ctx.setCookie(key, value, options);
        },
        get: (key: string) => {
          return ctx.cookie[key];
        },
        destroy: (key: string) => {
          ctx.deleteCookie(key);
        },
        outgoingCookies: [],
      },
      assets: [],
    };

    return runStore(store, () => ctx.next());
  });

  app.get("/__rsc", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("No path specified");
    }

    let requestUrl = new URL(path, url);
    let request = new Request(requestUrl, ctx.request);

    let initiator = ctx.request.headers.get("x-twofold-initiator");
    if (initiator === "refresh") {
      console.log("🔵 Refreshing", requestUrl.pathname);
    } else if (initiator === "client-side-navigation") {
      console.log("🟢 Rendering", requestUrl.pathname);
    }

    let page = runtime.pageForRequest(request);
    let stream = await page.rscStream();

    return new Response(stream, {
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

    console.log("🟢 Serving", url.pathname);

    let stream = await page.ssrStream();

    return new Response(stream, {
      headers: { "Content-type": "text/html" },
    });
  });

  return async function start() {
    await build.setup();
    await build.build();

    createServer(app.buildHandler()).listen(3000, "localhost", () => {
      console.log("Server listening on http://localhost:3000");
      build.watch();
    });
  };
}
