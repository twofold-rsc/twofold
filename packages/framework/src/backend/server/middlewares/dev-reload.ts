import { RouteHandler } from "@hattip/router";
import { ServerSentEventSink, serverSentEvents } from "@hattip/response";
import { Server } from "../../server.js";

type Connection = {
  connectionId: number;
  sink: ServerSentEventSink;
};

type ConnectionMode = "persistent" | "visibility";

export function devReload(server: Server): RouteHandler {
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

  return async ({ request, runtime }) => {
    let url = new URL(request.url);
    let pathname = url.pathname;
    let method = request.method;

    if (method === "GET" && pathname === "/__dev/reload") {
      let connectionId = id++;
      let unsubscribeFromServerStateInstalled: () => void;

      return serverSentEvents({
        onOpen(sink) {
          let previousMode = getConnectionMode();

          activeConnections.push({
            connectionId,
            sink,
          });

          let mode = getConnectionMode();

          unsubscribeFromServerStateInstalled = server.events.on(
            "serverStateInstalled",
            (serverState) => {
              if (serverState.status === "ready") {
                sink.sendMessage(
                  JSON.stringify({
                    type: "changes",
                    key: serverState.runtime.buildResult.key,
                    changes: serverState.runtime.buildResult.changes,
                  }),
                );
              } else if (serverState.status === "error") {
                sink.sendMessage(
                  JSON.stringify({
                    type: "error",
                    key: serverState.buildResult.key,
                    message: serverState.buildResult.error.message,
                  }),
                );
              }
            },
          );

          if (runtime) {
            let welcomeMessage = {
              type: "welcome",
              key: runtime.buildResult.key,
              mode,
            };

            sink.sendMessage(JSON.stringify(welcomeMessage));
          } else if (mode === previousMode) {
            sink.sendMessage(
              JSON.stringify({
                type: "mode",
                mode,
              }),
            );
          }

          if (mode !== previousMode) {
            broadcastMode(mode);
          }
        },
        onClose() {
          let previousMode = getConnectionMode();

          activeConnections = activeConnections.filter(
            (connection) => connection.connectionId !== connectionId,
          );

          if (unsubscribeFromServerStateInstalled) {
            unsubscribeFromServerStateInstalled();
          }

          let mode = getConnectionMode();
          if (mode !== previousMode) {
            broadcastMode(mode);
          }
        },
      });
    }
  };
}
