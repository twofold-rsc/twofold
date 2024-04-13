#!/usr/bin/env node

import { DevBuild } from "./build/dev-build.js";
import { ProdBuild } from "./build/prod-build.js";
import { Runtime } from "./runtime.js";

import { Command } from "commander";

const [major, minor, patch] = process.versions.node.split(".").map(Number);
let hasRequiredNodeVersion = major >= 20 && minor >= 9 && patch >= 0;
if (!hasRequiredNodeVersion) {
  console.log("You must use Node.js version 20.9.0 or higher to run twofold.");
  process.exit(1);
}

let program = new Command();

program.name("twofold").description("Twofold CLI");

program
  .command("dev")
  .description("Run the development server")
  .option(
    "--env <env>",
    "Which environment to run in (production, development)",
    "development",
  )
  .action(async (args) => {
    let build = args.env === "production" ? new ProdBuild() : new DevBuild();

    if (args.env === "production") {
      process.env.NODE_ENV = "production";
    }

    // start build
    await build.setup();
    await build.build();

    // create runtime
    let runtime = new Runtime(build);

    // start runtime
    await runtime.start();
  });

program
  .command("build")
  .description("Build the project for production")
  .action(async () => {
    process.env.NODE_ENV = "production";
    let build = new ProdBuild();

    // start build
    await build.setup();
    await build.build();
    await build.stop();

    // stash the build
    await build.save();
  });

program
  .command("serve")
  .description("Serve a production build")
  .action(async () => {
    process.env.NODE_ENV = "production";

    // create/load build
    let build = new ProdBuild();

    // load build
    await build.load();

    // create runtime
    let runtime = new Runtime(build);

    // start runtime
    await runtime.start();
  });

program.parse();
