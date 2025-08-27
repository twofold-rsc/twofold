#!/usr/bin/env node
import "./monkey-patch.js";
import "dotenv/config";
import { DevelopmentBuild } from "./build/build/development.js";
import { ProductionBuild } from "./build/build/production.js";
import { Command } from "commander";
import { DevTask } from "./tasks/dev.js";
import { ServeTask } from "./tasks/serve.js";

let nodeVersion = process.versions.node.split(".").map(Number);
let hasRequiredNodeVersion =
  nodeVersion[0] > 22 ||
  (nodeVersion[0] === 22 &&
    (nodeVersion[1] > 12 || (nodeVersion[1] === 12 && nodeVersion[2] >= 0)));

if (!hasRequiredNodeVersion) {
  console.log("You must use Node.js version 22.12.0 or higher to run twofold.");
  process.exit(1);
}

let nodeEnv = process.env.NODE_ENV ?? "development";

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

let program = new Command();

program.name("twofold").description("Twofold CLI");

program
  .command("dev")
  .description("Run the development server")
  .action(async () => {
    let build =
      nodeEnv === "production" ? new ProductionBuild() : new DevelopmentBuild();

    let task = new DevTask({ build });
    task.start();
  });

program
  .command("build")
  .description("Build the project for production")
  .action(async () => {
    let build =
      nodeEnv === "production" ? new ProductionBuild() : new DevelopmentBuild();

    // build
    await build.setup();
    let { time, key } = await build.build();
    console.log(`Build complete in ${time.toFixed(2)}ms [version: ${key}]`);
    await build.stop();

    // stash the build
    await build.save();
  });

program
  .command("serve")
  .alias("start")
  .description("Serve a production build")
  .action(async () => {
    let build =
      nodeEnv === "production" ? new ProductionBuild() : new DevelopmentBuild();

    let task = new ServeTask({ build });
    task.start();
  });

program.parse();
