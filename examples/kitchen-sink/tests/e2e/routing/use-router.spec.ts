import { expect, test } from "../test";

test("navigates to the useRouter example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "useRouter" }).click();

  await expect(page).toHaveURL("/routing/use-router");
  await expect(page.getByRole("heading", { name: "Router" })).toBeVisible();
});

test("server-renders and hydrates the current route", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/use-router");

  await expect(
    page.getByText("Path: /routing/use-router", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();

  verifyNoErrors();
});

test("refreshes the current route", async ({ page }) => {
  await page.goto("/routing/use-router");

  let currentTime = page.getByText(/^Current time:/);
  let initialTime = await currentTime.textContent();
  await page.getByRole("button", { name: "Refresh" }).click();

  await expect(currentTime).not.toHaveText(initialTime ?? "");
  await expect(page).toHaveURL("/routing/use-router");
});
