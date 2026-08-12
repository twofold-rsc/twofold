import { copyFileSync, existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

let envUrl = new URL(".env", import.meta.url);

// Seed the runtime test fixture before Playwright starts the development server.
if (!existsSync(envUrl)) {
  copyFileSync(new URL(".env.example", import.meta.url), envUrl);
}

export default defineConfig({
  testDir: "./tests/e2e/",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "app-build",
      testMatch: [
        "**/build/dev-reload.spec.ts",
        "**/build/hmr.spec.ts",
        "**/error-handling/*-build.spec.ts",
        "**/runtime/env-reload.spec.ts",
      ],
      workers: 1,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "app-run",
      testIgnore: [
        "**/build/dev-reload.spec.ts",
        "**/build/hmr.spec.ts",
        "**/error-handling/*-build.spec.ts",
        "**/runtime/env-reload.spec.ts",
      ],
      dependencies: ["app-build"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
