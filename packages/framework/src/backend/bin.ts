#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import * as vite from "vite";
import { withTwofold } from "./vite/plugins.js";
import { chmodSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";
import { randomBytes } from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

let nodeVersion = process.versions.node.split(".").map(Number);

if (
  !nodeVersion ||
  typeof nodeVersion[0] !== "number" ||
  typeof nodeVersion[1] !== "number" ||
  typeof nodeVersion[2] !== "number"
) {
  console.log("Could determine Node.js version, exiting.");
  process.exit(1);
}

let hasRequiredNodeVersion =
  nodeVersion[0] > 22 ||
  (nodeVersion[0] === 22 &&
    (nodeVersion[1] > 20 || (nodeVersion[1] === 20 && nodeVersion[2] >= 0)));

if (!hasRequiredNodeVersion) {
  console.log("You must use Node.js version 22.20.0 or higher to run twofold.");
  process.exit(1);
}

let program = new Command();

program.name("twofold").description("Twofold CLI");

program
  .command("dev")
  .option(
    "-p, --port <number>",
    "Port to run the development server on",
    "3000",
  )
  .description("Run the development server")
  .action(async (options) => {
    process.env.NODE_ENV = "development";

    {
      let key = process.env.TWOFOLD_SECRET_KEY;
      if (!key || typeof key !== "string") {
        console.warn(
          `Missing ${kleur.yellow("TWOFOLD_SECRET_KEY")}. Generating a random key.`,
        );
        process.env.TWOFOLD_SECRET_KEY = randomBytes(32).toString("hex");
      }
    }

    function createServerRestartHandler() {
      let restarting = false;

      return async (server: vite.ViteDevServer) => {
        if (restarting) {
          return;
        }
        restarting = true;
        try {
          console.log(
            "Performing full restart of server because files were created, renamed or deleted underneath /app/pages ...",
          );
          const previousUrls = server.resolvedUrls;
          await server.close();
          const newServer = await startDevServer(true);
          if (previousUrls) {
            server.resolvedUrls = newServer.resolvedUrls;
          }
        } finally {
          restarting = false;
        }
      };
    }

    async function startDevServer(
      isRestart: boolean,
    ): Promise<vite.ViteDevServer> {
      const port = parseInt(options.port, 10) || 3000;
      const server = await vite.createServer(
        withTwofold({
          server: { host: "0.0.0.0", port },
        }),
      );
      const handleServerRestart = createServerRestartHandler();
      await server.listen();

      server.watcher.on("unlink", invalidateOnTreeChange);
      server.watcher.on("add", invalidateOnTreeChange);

      async function invalidateOnTreeChange(changedFile: string) {
        if (!changedFile.startsWith(process.cwd())) {
          return;
        }
        const relativePath = path
          .relative(process.cwd(), changedFile)
          .replaceAll("\\", "/");
        if (relativePath.startsWith("app/")) {
          await handleServerRestart(server);
        }
      }

      if (!isRestart) {
        await server.printUrls();
      }

      return server;
    }

    const server = await startDevServer(false);
    await server.bindCLIShortcuts({ print: true });
  });

program
  .command("build")
  .description("Build the project for production")
  .action(async () => {
    process.env.NODE_ENV = "production";
    const builder = await vite.createBuilder(withTwofold({}));
    await builder.buildApp();
    await copyFile(
      path.join(__dirname, "vite/production/server.js"),
      path.join(process.cwd(), ".twofold/server.js"),
    );
    chmodSync(path.join(process.cwd(), ".twofold/server.js"), 0o775);

    console.log(
      `
🎉 Your Twofold app was successfully built.

You can now run '${kleur["bold"](kleur["green"](`.twofold/server.js`))}' to run your server.

You can also copy the self-contained '.twofold' folder to another location (e.g. inside a Docker container), and run your app without source code or installing node_modules.
`,
    );
  });

program
  .command("preview")
  .option(
    "-p, --port <number>",
    "Port to run the development server on",
    "3000",
  )
  .description("Preview a built production build")
  .action(async (options) => {
    process.env.NODE_ENV = "production";
    const port = parseInt(options.port, 10) || 3000;
    const previewServer = await vite.preview(
      withTwofold({
        preview: {
          port: port,
        },
      }),
    );
    await previewServer.printUrls();
    await previewServer.bindCLIShortcuts({ print: true });
  });

program.parse();
