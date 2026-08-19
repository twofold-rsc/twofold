import { useEffect, useLayoutEffect, useRef } from "react";
import * as z from "zod";

const hiddenDisconnectDelay = 3_000;

const connectionModeSchema = z.enum(["persistent", "visibility"]);

const messagesSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("error"),
    key: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("welcome"),
    key: z.string(),
    mode: connectionModeSchema,
  }),
  z.object({
    type: z.literal("mode"),
    mode: connectionModeSchema,
  }),
  z.object({
    type: z.literal("changes"),
    key: z.string(),
    changes: z.object({
      rscFiles: z.object({
        added: z.array(z.string()),
      }),
      chunkFiles: z.object({
        added: z.array(z.string()),
      }),
      chunkIds: z.object({
        added: z.array(z.string()),
      }),
      cssFiles: z.object({
        added: z.array(z.string()),
        removed: z.array(z.string()),
      }),
    }),
  }),
]);

type Message = z.infer<typeof messagesSchema>;
type ReloadMessage = Extract<Message, { type: "changes" | "error" }>;
type ConnectionMode = z.infer<typeof connectionModeSchema>;

export function useDevReload(onMessage: (message: ReloadMessage) => void) {
  let key = useRef<string>(null);
  let messageHandler = useRef(onMessage);

  // replace this ref with useEffectEvent when we drop react 19.1 support
  useLayoutEffect(() => {
    messageHandler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let eventSource: EventSource | undefined;
    let disconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let mode: ConnectionMode = "persistent";

    function clearDisconnectTimer() {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = undefined;
      }
    }

    function disconnect() {
      clearDisconnectTimer();
      if (eventSource) {
        eventSource.close();
        eventSource = undefined;
      }
    }

    function updateConnection() {
      clearDisconnectTimer();

      if (!document.hidden) {
        connect();
      } else if (mode === "visibility" && eventSource) {
        disconnectTimer = setTimeout(disconnect, hiddenDisconnectDelay);
      }
    }

    function connect() {
      if (eventSource) {
        return;
      }

      eventSource = new EventSource("/__dev/reload");

      eventSource.onmessage = (event) => {
        let data = JSON.parse(event.data);
        let result = messagesSchema.safeParse(data);

        if (result.error) {
          console.warn("Could not parse dev reload message", result.error);
          return;
        }

        let message = result.data;

        if (message.type === "welcome") {
          let previousKey = key.current;
          key.current = message.key;
          mode = message.mode;

          if (previousKey && previousKey !== message.key) {
            window.location.reload();
            return;
          }

          updateConnection();
        } else if (message.type === "mode") {
          mode = message.mode;
          updateConnection();
        } else {
          key.current = message.key;
          messageHandler.current(message);
        }
      };

      eventSource.onerror = (_error) => {
        // EventSource reconnects automatically after transient failures.
      };
    }

    connect();
    document.addEventListener("visibilitychange", updateConnection);

    return () => {
      document.removeEventListener("visibilitychange", updateConnection);
      disconnect();
    };
  }, []);
}
