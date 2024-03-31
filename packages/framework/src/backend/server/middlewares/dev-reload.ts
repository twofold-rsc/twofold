import { RouteHandler } from "@hattip/router";
import { DevBuild } from "../../build/dev-build";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";

type Connection = {
  sink: ServerSentEventSink;
  close: () => void;
};

let activeConnections: Connection[] = [];

export function devReload(build: DevBuild): RouteHandler {
  if (process.env.NODE_ENV === "production") {
    return () => {};
  } else {
    return async ({ request }) => {
      let url = new URL(request.url);
      let pathname = url.pathname;
      let method = request.method;

      if (method === "GET" && pathname === "/__dev/reload") {
        let handler: () => void;

        return serverSentEvents({
          onOpen(sink) {
            handler = () => {
              // console.log("css", build.newCSSFiles);
              // console.log("chunks", build.newChunks);
              // console.log("RSCs", build.newRSCs);

              // might want to just prefer to always do an "rsc" reload, since thats
              // really the safest thing to do.

              let json =
                build.newRSCs.size > 0
                  ? {
                      type: "rsc",
                    }
                  : build.newCSSFiles.size > 0
                    ? { type: "css" }
                    : build.newChunks.size > 0
                      ? {
                          type: "chunks",
                          chunks: Array.from(build.newChunks),
                        }
                      : { type: "unknown" };

              sink.sendMessage(JSON.stringify(json));
            };

            let close = () => {
              sink.close();
              build.events.off("complete", handler);
            };

            if (activeConnections.length > 8) {
              let connection = activeConnections.shift();
              if (connection) {
                connection.close();
              }
            }

            activeConnections.push({ close, sink });
            build.events.on("complete", handler);
          },
          onClose() {
            build.events.off("complete", handler);
          },
        });
      }
    };
  }
}
