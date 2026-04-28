import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["./src/backend/bin.ts"],
    format: ["esm"],
    outDir: "./dist/backend",
    platform: "node",
    unbundle: true,
    fixedExtension: false,
    dts: {
      sourcemap: process.argv.slice(2).includes("--sourcemap"),
    },
  },
  {
    entry: [
      "./src/backend/vite/production/server.ts",
      "./src/backend/vite/production/server/index.js",
    ],
    format: ["esm"],
    outDir: "./dist/backend/vite/production",
    platform: "node",
    deps: {
      onlyBundle: false,
      alwaysBundle: [/.+/],
    },
    fixedExtension: false,
    dts: false,
  },
]);
