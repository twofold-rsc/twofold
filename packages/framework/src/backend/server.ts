import "./monkey-patch.js";
import { createServer } from "@hattip/adapter-node";
import { parseHeaderValue } from "@hattip/headers";
import { createRouter } from "@hattip/router";
import { readFile } from "fs/promises";
import {
  renderToReadableStream,
  decodeReply,
  // @ts-ignore
} from "react-server-dom-webpack/server.browser";
import { asyncLocalStorage } from "./store.js";
import { Build } from "./build.js";
import { CookieSerializeOptions, cookie } from "@hattip/cookie";
import { SignedCookieStore, session } from "@hattip/session";
import { MultipartResponse } from "./multipart-response.js";
import { Worker, MessageChannel } from "node:worker_threads";
import { DevReload } from "./server/dev-reload.js";
import { Runtime } from "./runtime.js";
import { fileURLToPath } from "url";
import { appCompiledDir } from "./files.js";
import { errors } from "./server/errors.js";

export async function makeServer(build: Build) {
  let runtime = new Runtime(build);
  let worker: Worker | null;

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

  app.use(cookie());

  let cookieSecret = "secret";
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

  let reqId = 0;

  app.use(DevReload(build));
  app.use(errors(build));

  app.use(async (ctx) => {
    reqId = reqId + 1;
    let requestUrl = new URL(ctx.request.url);

    let isRSCRequest =
      requestUrl.pathname === "/__rsc" || runtime.pageForRequest(ctx.request);

    if (isRSCRequest) {
      let store = {
        reqId,
        cookies: {
          set: (
            key: string,
            value: string,
            options: CookieSerializeOptions,
          ) => {
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
        actions: {
          results: {},
        },
      };

      return await asyncLocalStorage.run(store, async () => {
        let ans = await ctx.next();
        return ans;
      });
    }
  });

  app.get("/**/*", async (ctx) => {
    let url = new URL(ctx.request.url);
    let request = ctx.request;

    let page = runtime.pageForUrl(url);

    if (page) {
      console.log("handing:", ctx.request.method, url.pathname);

      await page.runMiddleware(request);

      let assets = page.assets.map((asset) => `/_assets/styles/${asset}`);

      let store = asyncLocalStorage.getStore();
      if (store) {
        store.assets = [...store.assets, ...assets];
      }

      let reactTree = await page.reactTree(request);
      let rscStream = renderToReadableStream(
        reactTree,
        build.clientComponentMap,
        {
          onError(err: unknown) {
            console.log("RSC STREAM ERROR");
          },
        },
      );

      let { port1, port2 } = new MessageChannel();

      let htmlStream = new ReadableStream({
        start(controller) {
          let handle = function (m: Uint8Array | string) {
            if (typeof m === "string" && m === "DONE") {
              controller.close();
              port1.off("message", handle);
              port1.close();
            } else {
              controller.enqueue(m);
            }
          };

          port1.on("message", handle);
        },
      });

      if (!worker) {
        throw new Error("Worker not available");
      }

      worker.postMessage(
        {
          pathname: url.pathname,
          port: port2,
        },
        [port2],
      );

      // put somewhere
      let reader = rscStream.getReader();
      reader.read().then(function processStream({
        done,
        value,
      }: {
        done: boolean;
        value: Uint8Array;
      }) {
        if (value) {
          port1.postMessage(value, [value.buffer]);
        }
        if (done) {
          port1.postMessage("DONE");
        } else {
          return reader.read().then(processStream);
        }
      });

      return new Response(htmlStream, {
        headers: { "Content-type": "text/html" },
      });
    }
  });

  app.get("/__rsc", async (ctx) => {
    let url = new URL(ctx.request.url);
    let path = url.searchParams.get("path");

    if (typeof path !== "string") {
      throw new Error("404 - No path specified");
    }

    let request = new Request(new URL(path, url), ctx.request);
    let page = runtime.pageForRequest(request);

    if (!page) {
      throw new Error("404 - Page not found");
    }

    await page.runMiddleware(request);

    let assets = page.assets.map((asset) => `/_assets/styles/${asset}`);

    let store = asyncLocalStorage.getStore();
    if (store) {
      store.assets = [...store.assets, ...assets];
    }

    let reactTree = await page.reactTree(request);
    let stream = renderToReadableStream(reactTree, build.clientComponentMap);

    return new Response(stream, {
      headers: { "Content-type": "text/x-component" },
    });
  });

  app.post("/__rsc", async (ctx) => {
    let serverReference = ctx.request.headers.get("x-twofold-server-reference");
    if (!serverReference) {
      throw new Error("404 - No server action specified");
    }

    if (!build.actions.isAction(serverReference)) {
      throw new Error("404 - Server action not found");
    }

    let path = ctx.request.headers.get("x-twofold-path");
    if (!path) {
      throw new Error("404 - Page not found");
    }

    let url = new URL(ctx.request.url);
    let request = new Request(new URL(path, url), ctx.request);
    let page = runtime.pageForRequest(request);

    if (!page) {
      throw new Error("404 - Page not found");
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

    let actionResult = await build.actions.runAction(serverReference, args);

    let serializedResult: string | undefined;
    if (actionResult) {
      try {
        serializedResult = JSON.stringify(actionResult);
      } catch {
        console.error(
          "Action returned non-serializable result, cannot send to client",
        );
      }
    }

    let store = asyncLocalStorage.getStore();

    if (store) {
      console.log("ADDING RESULT TO STORE!");
      store.actions.results[serverReference] = actionResult;
      store.cookies.outgoingCookies = ctx.outgoingCookies;
    }

    // start render

    await page.runMiddleware(request);

    let assets = page.assets.map((asset) => `/_assets/styles/${asset}`);
    if (store) {
      store.assets = [...store.assets, ...assets];
    }

    let reactTree = await page.reactTree(request);
    let rscStream = renderToReadableStream(reactTree, build.clientComponentMap);

    let multipart = new MultipartResponse();

    if (serializedResult !== undefined) {
      multipart.add({
        type: "application/json",
        body: serializedResult,
        headers: {
          "x-twofold-server-reference": serverReference,
        },
      });
    }

    multipart.add({
      type: "text/x-component",
      body: rscStream,
      headers: {
        "x-twofold-path": path,
      },
    });

    return multipart.response();
  });

  app.get("/_assets/browser-app/bootstrap/:hash.js", async ({ request }) => {
    let modulePath = build.apps.browser.bootstrapPath;
    let contents = await readFile(modulePath, "utf-8");

    return new Response(contents, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  });

  app.get("/_assets/browser-app/chunks/chunk-:hash.js", async ({ params }) => {
    let { hash } = params as unknown as { hash: string };
    let chunk = build.apps.browser.chunks.find((chunk) => chunk.hash === hash);

    if (chunk) {
      let contents = await readFile(chunk.path, "utf-8");

      return new Response(contents, {
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }
  });

  app.get("/_assets/browser-app/entries/:name-:hash.js", async ({ params }) => {
    let { name, hash } = params as unknown as { name: string; hash: string };

    let entriesUrl = new URL("./browser-app/entries/", appCompiledDir);
    let fileUrl = new URL(`${name}-${hash}.js`, entriesUrl);
    let filePath = fileURLToPath(fileUrl);

    let clientComponentModuleMap = build.clientComponentModuleMap;

    // crappy O(n) lookup, change this
    let keys = Object.keys(clientComponentModuleMap);
    let moduleKey = keys.find(
      (key) => clientComponentModuleMap[key].browser === filePath,
    );
    let module = moduleKey ? clientComponentModuleMap[moduleKey] : null;

    if (module && module.browser) {
      let contents = await readFile(module.browser, "utf-8");

      return new Response(contents, {
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }
  });

  app.get("/_assets/styles/**/*", async ({ request }) => {
    let { pathname } = new URL(request.url);

    let cssPath = pathname.replace(/^\/_assets\/styles\//, "");
    let knownFile = build.rsc.css.includes(cssPath);

    if (!knownFile) {
      throw new Error("404 - File not found");
    }

    let cssUrl = new URL("./rsc/css/", appCompiledDir);
    let fileUrl = new URL(cssPath, cssUrl);
    let contents = await readFile(fileUrl, "utf-8");
    return new Response(contents, {
      headers: {
        "Content-Type": "text/css",
      },
    });
  });

  app.use(() => {
    throw new Error("404 - Page not found");
  });

  function createWorker() {
    if (build.error) {
      worker = null;
    } else {
      let bootstrapUrl = `/_assets/browser-app/bootstrap/${build.apps.browser.bootstrapHash}.js`;

      worker = new Worker(new URL("./workers/ssr-worker.js", import.meta.url), {
        workerData: {
          bootstrapUrl,
          appPath: build.apps.ssr.appPath,
          clientComponentModuleMap: build.clientComponentModuleMap,
        },
        execArgv: ["-C", "default"],
        env: {
          NODE_OPTIONS: "",
        },
      });
    }
  }

  return async function start() {
    await build.setup();
    await build.build();

    createWorker();
    build.events.on("complete", async () => {
      await worker?.terminate();
      createWorker();
    });

    createServer(app.buildHandler()).listen(3000, "localhost", () => {
      console.log("Server listening on http://localhost:3000");
      build.watch();
    });
  };
}
