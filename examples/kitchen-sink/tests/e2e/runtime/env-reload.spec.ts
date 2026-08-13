import { readFile, writeFile } from "node:fs/promises";

import { expect, test } from "../test";

test(
  "reloads when the environment variables change",
  { tag: "@build" },
  async ({ page }) => {
    let envUrl = new URL("../../../.env", import.meta.url);
    let source = await readFile(envUrl, "utf8");
    let updatedValue = `updated-environment-value-${crypto.randomUUID()}`;
    let updatedSource = source.replace(
      /^KITCHEN_SINK_TEST_ENV=.*$/m,
      `KITCHEN_SINK_TEST_ENV=${updatedValue}`,
    );

    await page.goto("/runtime/env");

    let serverEnvValue = page.getByTestId("server-env-value");
    await expect(serverEnvValue).toHaveText("this-should-be-a-string");

    try {
      await writeFile(envUrl, updatedSource);

      await expect(serverEnvValue).toHaveText(updatedValue, {
        timeout: 15_000,
      });
    } finally {
      await writeFile(envUrl, source);

      await expect(serverEnvValue).toHaveText("this-should-be-a-string", {
        timeout: 15_000,
      });
    }
  },
);
