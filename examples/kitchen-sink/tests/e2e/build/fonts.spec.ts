import { expect, test } from "../test";

test("navigates to the font assets example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Font assets", { exact: true }).click();

  await expect(page).toHaveURL("/build/fonts");
  await expect(
    page.getByRole("heading", { name: "Font imports" }),
  ).toBeVisible();
});

test("server-renders font imports", async ({ page, verifyNoErrors }) => {
  await page.goto("/build/fonts");

  await expect(page.getByTestId("local-font")).toBeVisible();
  await expect(page.getByTestId("global-font")).toBeVisible();

  await expect(
    page.locator('link[rel="preload"][as="font"][href*="orbitron"]').first(),
  ).toBeAttached();
  await expect(
    page
      .locator('link[rel="preload"][as="font"][href*="press-start-2p"]')
      .first(),
  ).toBeAttached();

  verifyNoErrors();
});

test("loads the local font import", async ({ page }) => {
  await page.goto("/build/fonts");

  await expect(page.getByTestId("local-font")).toHaveCSS(
    "font-family",
    "Orbitron, sans-serif",
  );
});

test("loads the public font import", async ({ page }) => {
  await page.goto("/build/fonts");

  await expect(page.getByTestId("global-font")).toHaveCSS(
    "font-family",
    '"Press Start 2P", system-ui',
  );
});
