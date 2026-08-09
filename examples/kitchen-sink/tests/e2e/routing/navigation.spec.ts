import { expect, test } from "../test";

test("navigates to the navigation example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.locator('a[href="/routing/navigation"]').click();

  await expect(page).toHaveURL("/routing/navigation");
  await expect(
    page.getByText("Navigation index", { exact: true }),
  ).toBeVisible();
});

test("server-renders and hydrates the navigation links", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/navigation");

  await expect(
    page.getByText("Navigation index", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Load a page" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Custom transition" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("replaces the current page without leaving history", async ({ page }) => {
  await page.goto("/routing/navigation");
  await page.getByRole("link", { name: "Replace a page" }).click();

  await expect(page).toHaveURL("/routing/navigation/ending");
  await expect(
    page.getByText("Ending navigation page", { exact: true }),
  ).toBeVisible();
  await expect(page.goBack()).resolves.toBeNull();
});

test("navigates to an external link", async ({ page }) => {
  await page.goto("/routing/navigation");
  await page.getByRole("link", { name: "External link" }).click();

  await expect(page).toHaveURL("https://github.com/");
});

test("supports a custom transition to a slow page", async ({ page }) => {
  await page.goto("/routing/navigation");
  let link = page.getByRole("link", { name: "Custom transition" });
  await link.click();

  await expect(link).toHaveAttribute("data-transition-pending", "true");
  await expect(page).toHaveURL("/routing/navigation/ending");
  await expect(
    page.getByText("Ending navigation page", { exact: true }),
  ).toBeVisible();
});
