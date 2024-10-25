#!/usr/bin/env node

import { DevelopmentEnvironment } from "./build/environments/development.js";
import { ProductionEnvironment } from "./build/environments/production.js";
import { Runtime } from "./runtime.js";

import { Command } from "commander";

let [major, minor, patch] = process.versions.node.split(".").map(Number);
let hasRequiredNodeVersion = major >= 20 && minor >= 9 && patch >= 0;
if (!hasRequiredNodeVersion) {
  console.log("You must use Node.js version 20.9.0 or higher to run twofold.");
  process.exit(1);
}

let nodeEnv = process.env.NODE_ENV ?? "development";

let program = new Command();

program.name("twofold").description("Twofold CLI");

program
  .command("dev")
  .description("Run the development server")
  .action(async () => {
    let environment =
      nodeEnv === "production"
        ? new ProductionEnvironment()
        : new DevelopmentEnvironment();

    // start build
    await environment.setup();
    await environment.build();

    // create runtime
    let runtime = new Runtime(environment);

    // start runtime
    await runtime.start();
  });

program
  .command("build")
  .description("Build the project for production")
  .action(async () => {
    let environment =
      nodeEnv === "production"
        ? new ProductionEnvironment()
        : new DevelopmentEnvironment({ watch: false });

    // start build
    await environment.setup();
    await environment.build();
    await environment.stop();

    // stash the build
    await environment.save();
  });

program
  .command("serve")
  .description("Serve a production build")
  .action(async () => {
    let environment =
      nodeEnv === "production"
        ? new ProductionEnvironment()
        : new DevelopmentEnvironment({ watch: false });

    // load build
    await environment.load();

    // create runtime
    let runtime = new Runtime(environment);

    // start runtime
    await runtime.start();
  });

program.parse();
