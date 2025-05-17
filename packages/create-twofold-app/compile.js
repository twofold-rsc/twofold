let { build } = require("esbuild");
let { rm } = require("fs/promises");
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
}

main();
