import "server-only";
import { getStore } from "../../backend/stores/rsc-store";
import { SerializeOptions } from "cookie";

let cookies = {
  get(name: string) {
    let store = getStore();
    let outgoing = store.cookies.outgoingCookies.find((c) => c.name === name);
    return outgoing?.value ?? store.cookies.get(name);
  },

  set(name: string, value: string, options?: SerializeOptions) {
    let store = getStore();
    // TODO: don't allow setting cookies during render
    store.cookies.set(name, value, options);
  },

  destroy(name: string, options?: SerializeOptions) {
    let store = getStore();
    store.cookies.destroy(name, options);
  },
};

export default cookies;
