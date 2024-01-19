#!/usr/bin/env node

import { rm } from "fs/promises";
import { Build } from "./build.js";
import { makeServer } from "./server.js";
import { appCompiledDir } from "./files.js";

async function main() {
  await rm(appCompiledDir, { recursive: true, force: true });

  let build = new Build();
  let start = await makeServer(build);
  await start();
}

main();
