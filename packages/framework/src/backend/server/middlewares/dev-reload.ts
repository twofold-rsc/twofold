import { RouteHandler } from "@hattip/router";
import { DevBuild } from "../../build/dev-build";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";

type Connection = {
  sink: ServerSentEventSink;
  close: () => void;
};

let activeConnections: Connection[] = [];

export function devReload(build: DevBuild): RouteHandler {
  return async ({ request }) => {
    let url = new URL(request.url);
    let pathname = url.pathname;
    let method = request.method;

    if (method === "GET" && pathname === "/__dev/reload") {
      let handler: () => void;

      return serverSentEvents({
        onOpen(sink) {
          handler = () => {
            // console.log(build.changes);
            sink.sendMessage(JSON.stringify(build.changes));
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
