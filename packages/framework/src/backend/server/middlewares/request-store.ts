import { RouteHandler } from "@hattip/router";
import { SerializeOptions } from "cookie";
import { Store, runStore } from "../../stores/rsc-store.js";
import { Runtime } from "../../runtime.js";

let reqId = 0;

export function requestStore(runtime: Runtime): RouteHandler {
  let build = runtime.build;

  return async (ctx) => {
    reqId = reqId + 1;

    let defaultCookieOptions: SerializeOptions = {
      path: "/",
    };

    let store: Store = {
      reqId,
      build: build.name,
      canReload: build.canReload,
      cookies: {
        set: (key: string, value: string, options?: SerializeOptions) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.setCookie(key, value, cookieOptions);
        },
        get: (key: string) => {
          return ctx.cookie[key];
        },
        destroy: (key: string, options?: SerializeOptions) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.deleteCookie(key, cookieOptions);
        },
        outgoingCookies: [],
      },
      assets: [],
      render: {
        async treeToStaticHtml(tree) {
          let rsc = await runtime.renderRSCStreamFromTree(tree);
          let html = await runtime.renderHtmlStreamFromRSCStream(
            rsc.stream,
            "static",
          );

          // buffer everything from the static "stream" into a string, then
          // resolve the promise when the stream ends.
          return new Promise<string>((resolve, reject) => {
            let content = "";
            html.stream.pipeThrough(new TextDecoderStream()).pipeTo(
              new WritableStream({
                write(chunk) {
                  content += chunk;
                },
                close() {
                  resolve(content);
                },
                abort(reason) {
                  reject(reason);
                },
              }),
            );
          });
        },
      },
    };

    return runStore(store, () => ctx.next());
  };
}
