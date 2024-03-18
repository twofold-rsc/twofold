import { RouteHandler } from "@hattip/router";
import { CookieSerializeOptions } from "cookie";
import { runStore } from "../../stores/rsc-store.js";

let reqId = 0;

export function requestStore(): RouteHandler {
  return async (ctx) => {
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
        destroy: (key: string, options: CookieSerializeOptions) => {
          ctx.deleteCookie(key, options);
        },
        outgoingCookies: [],
      },
      assets: [],
    };

    return runStore(store, () => ctx.next());
  };
}
