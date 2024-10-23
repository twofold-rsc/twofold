import { RouteHandler } from "@hattip/router";
import { DevelopmentEnvironment } from "../../build/environments/development";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";

type Connection = {
  sink: ServerSentEventSink;
  close: () => void;
};

let activeConnections: Connection[] = [];

export function devReload(environment: DevelopmentEnvironment): RouteHandler {
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
            sink.sendMessage(JSON.stringify(environment.changes));
          };

          let close = () => {
            sink.close();
            environment.events.off("complete", handler);
          };

          if (activeConnections.length > 8) {
            let connection = activeConnections.shift();
            if (connection) {
              connection.close();
            }
          }

          activeConnections.push({ close, sink });
          environment.events.on("complete", handler);
        },
        onClose() {
          environment.events.off("complete", handler);
        },
      });
    }
  };
}
