import { type NodePlatformInfo } from "@hattip/adapter-node/native-fetch";
import { type AdapterRequestContext } from "@hattip/core";
import routerProxy from "virtual:twofold/server-application-router";

export default {
  fetchFromContext: (
    context: AdapterRequestContext<NodePlatformInfo>,
  ): Promise<Response> => {
    return routerProxy.fetchFromContext(context);
  },
  fetch: (req: Request): Promise<Response> => {
    return routerProxy.fetch(req);
  },
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
