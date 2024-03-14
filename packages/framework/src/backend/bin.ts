#!/usr/bin/env node

import { Build } from "./build.js";
import { Runtime } from "./runtime.js";

async function main() {
  // verify node version
  const [major, minor, patch] = process.versions.node.split(".").map(Number);
  let hasRequiredNodeVersion = major >= 20 && minor >= 9 && patch >= 0;
  if (!hasRequiredNodeVersion) {
    console.log(
      "You must use Node.js version 20.9.0 or higher to run twofold.",
    );
    process.exit(1);
  }

  // create/load build
  let build = new Build();

  // create runtime
  let runtime = new Runtime(build);

  // start build
  await build.setup();
  await build.build();

  // start server
  await runtime.server();
}

main();
