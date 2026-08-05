import { expect, test } from "../test";

test("navigates to the public example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Public folder", { exact: true }).click();

  await expect(page).toHaveURL("/http/public");
  await expect(page.getByRole("heading", { name: "Public" })).toBeVisible();
});

test("server-renders and hydrates the public example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/public");

  await expect(
    page.getByRole("link", { name: "static.txt", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "nested-static.txt", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "logo.png", exact: true }),
  ).toBeVisible();

  verifyNoErrors();
});

test("serves the static public file through browser navigation", async ({
  page,
}) => {
  await page.goto("/http/public");

  await page.getByRole("link", { name: "static.txt", exact: true }).click();
  await expect(page).toHaveURL("/static.txt");
  await expect(page.locator("body")).toContainText(/static/i);
});

test("serves the nested public file through browser navigation", async ({
  page,
}) => {
  await page.goto("/http/public");

  await page
    .getByRole("link", { name: "nested-static.txt", exact: true })
    .click();
  await expect(page).toHaveURL("/nested-folder/nested-static.txt");
  await expect(page.locator("body")).toContainText(/nested/i);
});

test("serves the public image through browser navigation", async ({ page }) => {
  await page.goto("/http/public");

  await page.getByRole("link", { name: "logo.png", exact: true }).click();
  await expect(page).toHaveURL("/logo.png");

  let image = page.locator("img");
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
});
