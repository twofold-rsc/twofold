import { expect, test } from "./test";

test("shows the welcome message", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Welcome", { exact: true })).toBeVisible();
});
