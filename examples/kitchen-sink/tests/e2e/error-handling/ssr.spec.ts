import { expect, test } from "../test";

test("recovers from an SSR error with a client render", async ({ page }) => {
  await page.goto("/error-handling/ssr/ssr-throw");

  await expect(page.getByText("Did I render?", { exact: true })).toBeVisible();
});
