import type { RouteHandler } from "@hattip/router";
import { type ServerSentEventSink, serverSentEvents } from "@hattip/response";
import type { Runtime } from "../runtime.js";

type Connection = {
  connectionId: number;
  sink: ServerSentEventSink;
};

type ConnectionMode = "persistent" | "visibility";

export class DevReload {
  #activeConnections: Connection[] = [];
  #nextConnectionId = 1;

  middleware(runtime: Runtime): RouteHandler {
    let buildKey = runtime.buildResult.key;

    return ({ request }) => {
      let url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/__dev/reload") {
        return this.#openConnection(buildKey);
      }
    };
  }

  runtimeInstalled(runtime: Runtime) {
    let buildResult = runtime.buildResult;
    let payload = JSON.stringify({
      type: "changes",
      key: buildResult.key,
      changes: buildResult.changes,
    });

    for (let connection of this.#activeConnections) {
      connection.sink.sendMessage(payload);
    }
  }

  #openConnection(buildKey: string) {
    let connectionId = this.#nextConnectionId++;

    return serverSentEvents({
      onOpen: (sink) => {
        let previousMode = this.#getConnectionMode();

        this.#activeConnections.push({
          connectionId,
          sink,
        });

        let mode = this.#getConnectionMode();

        sink.sendMessage(
          JSON.stringify({
            type: "welcome",
            key: buildKey,
            mode,
          }),
        );

        if (mode !== previousMode) {
          this.#broadcastMode(mode);
        }
      },
      onClose: () => {
        let previousMode = this.#getConnectionMode();

        this.#activeConnections = this.#activeConnections.filter(
          (connection) => connection.connectionId !== connectionId,
        );

        let mode = this.#getConnectionMode();
        if (mode !== previousMode) {
          this.#broadcastMode(mode);
        }
      },
    });
  }

  #getConnectionMode(): ConnectionMode {
    return this.#activeConnections.length > 3 ? "visibility" : "persistent";
  }

  #broadcastMode(mode: ConnectionMode) {
    let payload = JSON.stringify({ type: "mode", mode });

    for (let connection of this.#activeConnections) {
      connection.sink.sendMessage(payload);
    }
  }
}
