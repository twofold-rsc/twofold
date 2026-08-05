import { expect, test } from "../test";

test("navigates to the streaming example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Streaming", { exact: true }).click();

  await expect(page).toHaveURL("/http/streaming");
  await expect(
    page.getByRole("heading", { name: "Streaming and Suspense" }),
  ).toBeVisible();
  await expect(
    page.getByText("Slow component loaded after 1000ms.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Slow component loaded after 2500ms.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Slow component loaded after 5000ms.", { exact: true }),
  ).toBeVisible();
});

test("server-renders and hydrates streaming fallbacks", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/streaming", { waitUntil: "commit" });

  let fallback = page.getByText("Loading...", { exact: true });
  await expect(fallback).toHaveCount(3);
  await expect(
    page.getByText("Slow component loaded after 1000ms.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Slow component loaded after 2500ms.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Slow component loaded after 5000ms.", { exact: true }),
  ).toBeVisible();
  await expect(fallback).toHaveCount(0);

  verifyNoErrors();
});
