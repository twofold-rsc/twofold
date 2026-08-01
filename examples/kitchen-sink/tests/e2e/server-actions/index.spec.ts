import { expect, test } from "../test";

test("navigates to the server action example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Server action", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions");
  await expect(
    page.getByRole("heading", { name: "Server action" }),
  ).toBeVisible();
});

test("server-renders and hydrates the server action example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions");

  await expect(page.getByText(/^The count is \d+$/)).toBeVisible();

  verifyNoErrors();
});

test("increments the count with a server action", async ({ page }) => {
  await page.goto("/server-actions");

  let count = page.getByText("The count is").locator("span");
  let initialCount = Number(await count.textContent());

  await page.getByRole("button", { name: "count + 1" }).click();

  await expect(count).toHaveText(String(initialCount + 1));
});
