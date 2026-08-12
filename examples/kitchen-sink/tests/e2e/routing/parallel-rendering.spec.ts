import { expect, test } from "../test";

test("navigates to the parallel rendering example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Parallel rendering" }).click();

  await expect(page).toHaveURL("/routing/parallel-rendering");
  await expect(
    page.getByRole("heading", { name: "Parallel rendering" }),
  ).toBeVisible();
});

test("server-renders and hydrates every parallel branch", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/parallel-rendering");

  await expect(
    page.getByRole("heading", { name: "Parallel rendering" }),
  ).toBeVisible();
  await expect(
    page.getByText("Outermost layout", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Inner layout", { exact: true })).toBeVisible();
  await expect(page.getByText("Page", { exact: true })).toBeVisible();
  verifyNoErrors();
});

test("renders nested layouts concurrently", async ({ page }) => {
  let startedAt = performance.now();

  await page.goto("/routing/parallel-rendering");

  await expect(
    page.getByText("Outermost layout", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Inner layout", { exact: true })).toBeVisible();
  await expect(page.getByText("Page", { exact: true })).toBeVisible();
  expect(performance.now() - startedAt).toBeLessThan(4000);
});
