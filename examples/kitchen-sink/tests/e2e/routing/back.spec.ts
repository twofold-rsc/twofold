import { expect, test } from "../test";

test("navigates to the Back example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Back" }).click();

  await expect(page).toHaveURL("/routing/back/start");
  await expect(page.getByRole("heading", { name: "Back start" })).toBeVisible();
});

test("server-renders and hydrates the Back example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/back/start");

  await expect(page.getByRole("heading", { name: "Back start" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to end" })).toBeVisible();

  verifyNoErrors();
});

test("navigates back to the start page", async ({ page }) => {
  await page.goto("/routing/back/start");

  await page.getByRole("link", { name: "Go to end" }).click();

  await expect(page).toHaveURL("/routing/back/end");
  await expect(page.getByRole("heading", { name: "Back end" })).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL("/routing/back/start");
  await expect(page.getByRole("heading", { name: "Back start" })).toBeVisible();
});

test("navigates back after reloading the end page", async ({ page }) => {
  await page.goto("/routing/back/start");
  await page.getByRole("link", { name: "Go to end" }).click();

  await expect(page).toHaveURL("/routing/back/end");
  await page.reload();

  await expect(page.getByRole("heading", { name: "Back end" })).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL("/routing/back/start");
  await expect(page.getByRole("heading", { name: "Back start" })).toBeVisible();
});
