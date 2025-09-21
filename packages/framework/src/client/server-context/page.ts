import "server-only";
import { getStore } from "../../backend/stores/rsc-store";

let page = {
  // this is an experiment with a very limited api while
  // i use this
  get searchParams() {
    let store = getStore();
    if (!store.context || store.context.type !== "page") {
      throw new Error("Cannot access page context outside of a page render");
    }

    let url = new URL(store.context.request.url);
    return url.searchParams;
  },
};

export default page;
