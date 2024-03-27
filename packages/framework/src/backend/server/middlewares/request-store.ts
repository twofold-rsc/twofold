import { RouteHandler } from "@hattip/router";
import { CookieSerializeOptions } from "cookie";
import { runStore } from "../../stores/rsc-store.js";

let reqId = 0;

export function requestStore(): RouteHandler {
  return async (ctx) => {
    reqId = reqId + 1;

    let defaultCookieOptions: CookieSerializeOptions = {
      path: "/",
    };

    let store = {
      reqId,
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
