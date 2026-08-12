import { expect, test } from "../test";

test("navigates to the scroll position example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByText("Scroll position", { exact: true }).click();

  await expect(page).toHaveURL("/routing/scroll-position");
  await expect(
    page.getByRole("heading", { name: "Scroll Position" }),
  ).toBeVisible();
});

test("server-renders and hydrates the scroll position example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/scroll-position");

  await expect(
    page.getByText("Navigate between pages with lots of content"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Text", exact: true }).click();

  await expect(page).toHaveURL("/routing/scroll-position/text");
  await expect(page.getByRole("heading", { name: "Page 2" })).toBeVisible();
  verifyNoErrors();
});

test("scrolls to the top on navigation", async ({ page }) => {
  await page.goto("/routing/scroll-position/text");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page
    .getByRole("link", { name: "HTML", exact: true })
    .dispatchEvent("click");

  await expect(page).toHaveURL("/routing/scroll-position/html");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("restores scroll on history back", async ({ page }) => {
  await page.goto("/routing/scroll-position/text");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page
    .getByRole("link", { name: "HTML", exact: true })
    .dispatchEvent("click");
  await expect(page).toHaveURL("/routing/scroll-position/html");

  await page.goBack();

  await expect(page).toHaveURL("/routing/scroll-position/text");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("restores scroll on history back to suspended content", async ({
  page,
}) => {
  await page.goto("/routing/scroll-position/text");
  await page
    .getByRole("link", { name: "Suspense boundary", exact: true })
    .click();

  const suspenseFallback = page.getByTestId("suspense-fallback");
  await expect(suspenseFallback).toBeVisible();

  // Wait for the streamed content to replace the Suspense fallback.
  await expect(suspenseFallback).toBeHidden();

  // Scroll to the bottom of the page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await page.getByRole("link", { name: "Go to HTML" }).click();
  await expect(page).toHaveURL("/routing/scroll-position/html");

  await page.goBack();

  await expect(page).toHaveURL("/routing/scroll-position/suspense-boundary");
  await expect(suspenseFallback).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.innerHeight + window.scrollY >= document.body.scrollHeight - 1,
      ),
    )
    .toBe(true);
});
