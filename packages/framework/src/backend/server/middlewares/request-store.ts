import { RouteHandler } from "@hattip/router";
import { CookieSerializeOptions } from "cookie";
import { Store, runStore } from "../../stores/rsc-store.js";
import { Build } from "../../build/base-build.js";

let reqId = 0;

export function requestStore(build: Build): RouteHandler {
  return async (ctx) => {
    reqId = reqId + 1;

    let defaultCookieOptions: CookieSerializeOptions = {
      path: "/",
    };

    let store: Store = {
      reqId,
      env: build.env,
      cookies: {
        set: (key: string, value: string, options?: CookieSerializeOptions) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.setCookie(key, value, cookieOptions);
        },
        get: (key: string) => {
          return ctx.cookie[key];
        },
        destroy: (key: string, options?: CookieSerializeOptions) => {
          let cookieOptions = {
            ...defaultCookieOptions,
            ...options,
          };

          ctx.deleteCookie(key, cookieOptions);
        },
        outgoingCookies: [],
      },
      assets: [],
    };

    return runStore(store, () => ctx.next());
  };
}
