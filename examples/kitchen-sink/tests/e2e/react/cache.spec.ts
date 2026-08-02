import { expect, test } from "../test";

test("navigates to the cache example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "cache" }).click();

  await expect(page).toHaveURL("/react/cache");
  await expect(page.getByRole("heading", { name: "Cache" })).toBeVisible();
  await expect(page.getByText(/^Random number: \d+$/)).toBeVisible();
});

test("server-renders the cached value for each waterfall component", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/react/cache");

  let randomNumber = page.getByTestId("random-number");
  await expect(randomNumber).toBeVisible();

  let value = await randomNumber.textContent();
  expect(value).toMatch(/^\d+$/);

  await expect(
    page.getByText(
      new RegExp(`^Waterfall component loaded! \\[${value}\\] \\[${value}\\]$`),
    ),
  ).toHaveCount(2);
  verifyNoErrors();
});
