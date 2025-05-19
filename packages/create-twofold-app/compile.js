let { build } = require("esbuild");
let { rm, readFile, writeFile } = require("fs/promises");
let path = require("path");

async function main() {
  let dir = path.resolve(__dirname, "dist");

  await rm(dir, { recursive: true, force: true });

  await build({
    format: "cjs",
    platform: "node",
    logLevel: "info",
    entryPoints: ["./src/**/*.ts"],
    outdir: "./dist",
    packages: "external",
  });

  let binEntry = path.resolve(__dirname, "dist", "index.js");
  let shebang = "#!/usr/bin/env node\n";

  let code = await readFile(binEntry, "utf8");

  if (!code.startsWith(shebang)) {
    await writeFile(binEntry, shebang + code, "utf8");
  }
}

main();
