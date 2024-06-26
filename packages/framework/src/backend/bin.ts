#!/usr/bin/env node

import { DevBuild } from "./build/dev-build.js";
import { ProdBuild } from "./build/prod-build.js";
import { Runtime } from "./runtime.js";

import { Command } from "commander";

let [major, minor, patch] = process.versions.node.split(".").map(Number);
let hasRequiredNodeVersion = major >= 20 && minor >= 9 && patch >= 0;
if (!hasRequiredNodeVersion) {
  console.log("You must use Node.js version 20.9.0 or higher to run twofold.");
  process.exit(1);
}

let env = process.env.NODE_ENV ?? "development";

let program = new Command();

program.name("twofold").description("Twofold CLI");

program
  .command("dev")
  .description("Run the development server")
  .action(async () => {
    let build = env === "production" ? new ProdBuild() : new DevBuild();

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
    let build = env === "production" ? new ProdBuild() : new DevBuild();

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
    let build = env === "production" ? new ProdBuild() : new DevBuild();

    // load build
    await build.load();

    // create runtime
    let runtime = new Runtime(build);

    // start runtime
    await runtime.start();
  });

program.parse();
