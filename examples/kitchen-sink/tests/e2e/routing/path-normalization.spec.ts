import { expect, test } from "../test";

test("normalizes the path when navigating from the examples menu", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByText("Path normalization", { exact: true }).click();

  await expect(page).toHaveURL("/routing/path-normalization");
  await expect(
    page.getByRole("heading", { name: "Path normalization" }),
  ).toBeVisible();
});

test("server-normalizes a trailing slash and hydrates the canonical page", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/path-normalization/");

  await expect(page).toHaveURL("/routing/path-normalization");
  await expect(
    page.getByText("This page should have no trailing slash."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Examples" }).click();
  await expect(page.getByRole("button", { name: "Routing" })).toBeVisible();
  verifyNoErrors();
});
