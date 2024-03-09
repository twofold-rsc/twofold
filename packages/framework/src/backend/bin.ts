#!/usr/bin/env node

import { rm } from "fs/promises";
import { Build } from "./build.js";
import { makeServer } from "./server.js";
import { appCompiledDir } from "./files.js";

async function main() {
  await rm(appCompiledDir, { recursive: true, force: true });

  // create/load build

  // create runtime

  // start server

  let build = new Build();
  // await build.setup();
  // await build.build();

  let start = await makeServer(build);
  await start();
}

main();
