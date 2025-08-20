import { RouteHandler } from "@hattip/router";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";
import { DevelopmentBuild } from "../../build/build/development.js";

type Connection = {
  connectionId: number;
  sink: ServerSentEventSink;
  close: () => void;
};

let activeConnections: Connection[] = [];
let id = 1;

export function devReload(build: DevelopmentBuild): RouteHandler {
  return async ({ request }) => {
    let url = new URL(request.url);
    let pathname = url.pathname;
    let method = request.method;

    if (method === "GET" && pathname === "/__dev/reload") {
      let connectionId = id++;
      let onBuildComplete: () => void;

      return serverSentEvents({
        onOpen(sink) {
          if (activeConnections.length > 8) {
            let connection = activeConnections.shift();
            if (connection) {
              connection.close();
            }
          }

          onBuildComplete = () => {
            let payload = {
              type: "changes",
              key: build.key,
              changes: build.changes,
            };
            // console.log(payload);
            sink.sendMessage(JSON.stringify(payload));
          };

          let close = () => {
            sink.close();
            build.events.off("complete", onBuildComplete);
          };

          activeConnections.push({
            connectionId,
            close,
            sink,
          });

          const welcomeMessage = {
            type: "welcome",
            key: build.key,
          };

          sink.sendMessage(JSON.stringify(welcomeMessage));

          build.events.on("complete", onBuildComplete);
        },
        onClose() {
          activeConnections = activeConnections.filter(
            (connection) => connection.connectionId !== connectionId,
          );
          build.events.off("complete", onBuildComplete);
        },
      });
    }
  };
}
