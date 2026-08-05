import { expect, test } from "../test";

test("navigates to the CSS example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("CSS", { exact: true }).click();

  await expect(page).toHaveURL("/build/css");
  await expect(page.getByRole("heading", { name: "CSS Page" })).toBeVisible();
});

test("loads custom CSS", async ({ page, verifyNoErrors }) => {
  await page.goto("/build/css");

  let message = page.getByText("This page has custom CSS");
  await expect(message).toBeVisible();
  await expect(message).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(message).toHaveCSS("background-color", "rgb(0, 0, 255)");

  verifyNoErrors();
});
