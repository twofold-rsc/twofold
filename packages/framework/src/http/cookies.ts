import { getStore } from "../backend/store.js";
import { CookieSerializeOptions } from "cookie";

let cookies = {
  get(name: string) {
    let store = getStore();
    let outgoing = store.cookies.outgoingCookies.find((c) => c.name === name);
    return outgoing?.value ?? store.cookies.get(name);
  },

  set(name: string, value: string, options?: CookieSerializeOptions) {
    let store = getStore();
    // dont allow setting cookies during render
    store.cookies.set(name, value, options);
  },

  destroy(name: string) {
    let store = getStore();
    store.cookies.destroy(name);
  },
};

export default cookies;
