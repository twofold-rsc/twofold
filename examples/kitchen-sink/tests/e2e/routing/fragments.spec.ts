import { expect, test } from "../test";

test("navigates to the fragments example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Link fragments" }).click();

  await expect(page).toHaveURL("/routing/fragments");
  await expect(page.getByRole("heading", { name: "Fragments" })).toBeVisible();
});

test("server-renders and hydrates a URL containing a fragment", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/fragments#two");

  await expect(page).toHaveURL("/routing/fragments#two");
  await expect(
    page.getByRole("heading", { name: "Fragment two" }),
  ).toBeVisible();
  await expect(
    page.getByText("Server path: /routing/fragments", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Client path: /routing/fragments", { exact: true }),
  ).toBeVisible();

  verifyNoErrors();
});

test("navigates between fragments without changing the route path", async ({
  page,
}) => {
  await page.goto("/routing/fragments");
  await page.getByRole("link", { name: "Fragment three" }).click();

  await expect(page).toHaveURL("/routing/fragments#three");
  await expect(
    page.getByRole("heading", { name: "Fragment three" }),
  ).toBeVisible();
  await expect(
    page.getByText("Server path: /routing/fragments", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Client path: /routing/fragments", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page).toHaveURL("/routing/fragments#three");
});
