import { build } from "esbuild";
import { rm } from "fs/promises";

async function main() {
  let dir = new URL("./dist/", import.meta.url);

  await rm(dir, { recursive: true, force: true });

  await build({
    format: "esm",
    platform: "node", // ??
    logLevel: "info",
    entryPoints: ["./src/**/*.ts"],
    outdir: "./dist",
    packages: "external",
  });
}

await main();
