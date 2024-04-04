import { build } from "esbuild";
import { rm } from "fs/promises";

async function main() {
  let dir = new URL("./dist/", import.meta.url);

  await rm(dir, { recursive: true, force: true });

  await build({
    format: "esm",
    logLevel: "info",
    entryPoints: ["./src/backend/**/*.ts"],
    outdir: "./dist/backend",
    packages: "external",
    platform: "node",
  });
}

await main();
