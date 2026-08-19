import { RouteHandler } from "@hattip/router";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";
import { DevelopmentBuild } from "../../build/build/development.js";

type Connection = {
  connectionId: number;
  sink: ServerSentEventSink;
};

type ConnectionMode = "persistent" | "visibility";

export function devReload(build: DevelopmentBuild): RouteHandler {
  let activeConnections: Connection[] = [];
  let id = 1;

  function getConnectionMode(): ConnectionMode {
    return activeConnections.length > 3 ? "visibility" : "persistent";
  }

  function broadcastMode(mode: ConnectionMode) {
    let payload = JSON.stringify({ type: "mode", mode });

    for (let connection of activeConnections) {
      connection.sink.sendMessage(payload);
    }
  }

  return async ({ request }) => {
    let url = new URL(request.url);
    let pathname = url.pathname;
    let method = request.method;

    if (method === "GET" && pathname === "/__dev/reload") {
      let connectionId = id++;
      let onBuildComplete: () => void;

      return serverSentEvents({
        onOpen(sink) {
          let previousMode = getConnectionMode();

          onBuildComplete = () => {
            let payload = build.error
              ? {
                  type: "error",
                  key: build.key,
                  message: build.error.message,
                }
              : {
                  type: "changes",
                  key: build.key,
                  changes: build.changes,
                };
            sink.sendMessage(JSON.stringify(payload));
          };

          activeConnections.push({
            connectionId,
            sink,
          });

          let mode = getConnectionMode();

          const welcomeMessage = {
            type: "welcome",
            key: build.key,
            mode,
          };

          sink.sendMessage(JSON.stringify(welcomeMessage));

          if (mode !== previousMode) {
            broadcastMode(mode);
          }

          build.events.on("complete", onBuildComplete);
        },
        onClose() {
          let previousMode = getConnectionMode();

          activeConnections = activeConnections.filter(
            (connection) => connection.connectionId !== connectionId,
          );
          build.events.off("complete", onBuildComplete);

          let mode = getConnectionMode();
          if (mode !== previousMode) {
            broadcastMode(mode);
          }
        },
      });
    }
  };
}
