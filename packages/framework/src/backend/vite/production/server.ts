#!/usr/bin/env node
import {
  createServer,
  type NodePlatformInfo,
} from "@hattip/adapter-node/native-fetch";
import { Command } from "commander";
import { Socket } from "node:net";
import { createRouter } from "@hattip/router";
import { walk } from "@hattip/walk";
import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";

let program = new Command();

program
  .name("twofold-server")
  .description("Built Twofold app")
  .option("-p, --port <number>", "Port to run the server on", "3000")
  .action(async (options) => {
    process.env.NODE_ENV = "production";
    const port = parseInt(options.port, 10) || 3000;

    const applicationRouter = (await import("./server/index.js")).default;

    const router = createRouter<NodePlatformInfo>();

    // Serve static files.
    const staticRoot = new URL("./client", import.meta.url);
    const staticFiles = walk(staticRoot);
    router.use(
      createStaticMiddleware(staticFiles, createFileReader(staticRoot), {
        gzip: true,
      }),
    );

    // Handle all other requests via compiled server.
    router.use(async (context) => {
      return await applicationRouter.fetchFromContext(context);
    });

    const handler = router.buildHandler();
    const server = createServer(handler, {});

    // Track sockets for graceful shutdown.
    const activeSockets = new Map<Socket, number>();
    server
      .on("connection", (socket) => {
        activeSockets.set(socket, 0);
        socket.on("close", () => activeSockets.delete(socket));
      })
      .on("request", (req, res) => {
        let socket = req.socket;
        activeSockets.set(socket, (activeSockets.get(socket) || 0) + 1);
        res.once("close", () => {
          const n = activeSockets.get(socket) || 0;
          if (n > 1) {
            activeSockets.set(socket, n - 1);
          } else {
            activeSockets.delete(socket);
          }
        });
      });

    // Start the server.
    await new Promise<void>((resolve) => {
      server.listen(3000, "0.0.0.0", () => {
        resolve();
      });
    });
    console.log(`Production server started on 0.0.0.0:${port}.`);

    // Wait for Ctrl-C.
    await new Promise<void>((resolve) => {
      process.on("SIGTERM", () => {
        resolve();
      });
    });

    // Hard timeout.
    const timeoutId = setTimeout(() => {
      console.error("Force shutdown since server did not stop within 9s");
      process.exit(1);
    }, 9_000);

    // Wait for sockets to shutdown.
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        // Max timeout so poll function can't run forever.
        let continuePolling = true;
        const timeout = setTimeout(() => {
          continuePolling = false;
        }, 60_000);

        let poll = () => {
          if (!continuePolling) {
            reject(new Error("Shutdown error: Timed out."));
          } else if (server && !server.listening && activeSockets.size === 0) {
            clearTimeout(timeout);
            server.removeAllListeners();
            resolve();
          } else if (server && !server.listening) {
            for (let [socket, count] of activeSockets) {
              if (count === 0) {
                socket.destroy();
              }
            }
            setImmediate(poll);
          } else {
            setTimeout(poll, 30);
          }
        };

        server.close((err) => {
          if (err) {
            reject(err);
          }
        });

        poll();
      });
    }

    // Graceful shutdown complete.
    clearTimeout(timeoutId);
    process.exit(0);
  })
  .parse();
