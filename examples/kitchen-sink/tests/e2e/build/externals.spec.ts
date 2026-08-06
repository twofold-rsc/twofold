import { expect, test } from "../test";

test("navigates to the externals example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Build" }).click();
  await page.getByText("Externals", { exact: true }).click();

  await expect(page).toHaveURL("/build/config/external-packages");
  await expect(page.getByRole("heading", { name: "Externals" })).toBeVisible();
});

test("uses the external open graph scraper package", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/build/config/external-packages");

  await expect(
    page.getByText("Package: Open Graph Scraper", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("open-graph-result")).not.toBeEmpty();

  verifyNoErrors();
});

test("scrapes the Twofold Open Graph metadata", async ({ page }) => {
  await page.goto("/build/config/external-packages");

  let result = page.getByTestId("open-graph-result");
  await expect(result).toContainText('"ogTitle": "Twofold"');
  await expect(result).toContainText(
    '"ogDescription": "A React Server Component framework"',
  );
});
