import { copyFileSync, existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

let envUrl = new URL(".env", import.meta.url);

// Seed the runtime test fixture before Playwright builds the application.
if (!existsSync(envUrl)) {
  copyFileSync(new URL(".env.example", import.meta.url), envUrl);
}

let baseURL = "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./tests/e2e/",
  use: {
    baseURL,
  },
  webServer: {
    command: "pnpm build && pnpm serve --port 3001",
    stderr: "ignore",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "app-run-production",
      grepInvert: /@build|@development/,
      metadata: { environment: "production" },
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
