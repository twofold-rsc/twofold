import { expect, test } from "../test";

test("navigates to the Suspense example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "Suspense" }).click();

  await expect(page).toHaveURL("/react/suspense");
  await expect(page.getByRole("heading", { name: "Suspense" })).toBeVisible();
  await expect(page.getByText("Loading...", { exact: true })).toBeVisible();
  await expect(page.getByText("I finally loaded!", { exact: true })).toBeVisible();
  await expect(page.getByText("Loading...", { exact: true })).not.toBeVisible();
});

test("server-renders the Suspense fallback before the content", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/react/suspense", { waitUntil: "commit" });

  await expect(page.getByText("Loading...", { exact: true })).toBeVisible();
  await expect(page.getByText("I finally loaded!", { exact: true })).toBeVisible();
  await expect(page.getByText("Loading...", { exact: true })).not.toBeVisible();
  verifyNoErrors();
});
