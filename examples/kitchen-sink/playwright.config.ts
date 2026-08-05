import { defineConfig, devices } from "@playwright/test";

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
      testMatch: ["**/build/dev-reload.spec.ts", "**/build/hmr.spec.ts"],
      workers: 1,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: ["**/build/dev-reload.spec.ts", "**/build/hmr.spec.ts"],
      dependencies: ["app-build"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
