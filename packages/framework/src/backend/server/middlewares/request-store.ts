import { RouteHandler } from "@hattip/router";
import { SerializeOptions } from "cookie";
import { Store, runStore } from "../../stores/rsc-store.js";
import { Runtime } from "../../runtime.js";
import { encrypt, decrypt } from "../../encryption.js";
import { randomBytes } from "crypto";

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
        all: () => {
          return ctx.cookie;
        },
        set: (name, value, options) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.setCookie(name, value, cookieOptions);
        },
        get: (name) => {
          return ctx.cookie[name];
        },
        destroy: (name, options) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.deleteCookie(name, cookieOptions);
        },
        outgoingCookies: () => ctx.outgoingCookies,
      },
      encryption: {
        encrypt: (value) => {
          let key = process.env.TWOFOLD_SECRET_KEY;
          if (typeof key !== "string") {
            throw new Error("TWOFOLD_SECRET_KEY is not set");
          }

          return encrypt(value, key);
        },
        decrypt: (value) => {
          let key = process.env.TWOFOLD_SECRET_KEY;
          if (typeof key !== "string") {
            throw new Error("TWOFOLD_SECRET_KEY is not set");
          }

          return decrypt(value, key);
        },
      },
      flash: {
        add(message) {
          let flashId = randomBytes(12).toString("hex");
          let data = JSON.stringify(message);
          ctx.setCookie(`_tf_flash_${flashId}`, data, {
            path: "/",
            secure: false,
            maxAge: 60 * 60 * 24,
          });
        },
      },
      assets: [],
      render: {
        async treeToStaticHtml(tree) {
          let rsc = await runtime.renderRSCStream(tree);
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
