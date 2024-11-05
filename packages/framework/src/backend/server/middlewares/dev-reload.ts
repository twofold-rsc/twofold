import { RouteHandler } from "@hattip/router";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";
import { DevelopmentBuild } from "../../build/build/development";

type Connection = {
  connectionId: number;
  sink: ServerSentEventSink;
  close: () => void;
};

let activeConnections: Connection[] = [];
let id = 1;

type BuildWithChanges = DevelopmentBuild;

export function devReload(build: BuildWithChanges): RouteHandler {
  return async ({ request }) => {
    let url = new URL(request.url);
    let pathname = url.pathname;
    let method = request.method;

    if (method === "GET" && pathname === "/__dev/reload") {
      let connectionId = id++;
      let handler: () => void;

      return serverSentEvents({
        onOpen(sink) {
          if (activeConnections.length > 8) {
            let connection = activeConnections.shift();
            if (connection) {
              connection.close();
            }
          }

          handler = () => {
            // console.log(build.changes);
            sink.sendMessage(JSON.stringify(build.changes));
          };

          let close = () => {
            sink.close();
            build.events.off("complete", handler);
          };

          activeConnections.push({
            connectionId,
            close,
            sink,
          });

          build.events.on("complete", handler);
        },
        onClose() {
          activeConnections = activeConnections.filter(
            (connection) => connection.connectionId !== connectionId,
          );
          build.events.off("complete", handler);
        },
      });
    }
  };
}
