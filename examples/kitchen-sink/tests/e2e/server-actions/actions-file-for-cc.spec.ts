import { expect, test } from "../test";

test("navigates to the CC actions file example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Actions file CC", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/actions-file-for-cc");
  await expect(
    page.getByRole("heading", { name: "Server actions file CC" }),
  ).toBeVisible();
});

test("server-renders and hydrates the CC actions file example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/actions-file-for-cc");

  await expect(page.getByText(/^Count: \d+$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Run action" })).toBeVisible();

  verifyNoErrors();
});

test("runs an action from a CC actions file", async ({ page }) => {
  await page.goto("/server-actions/actions-file-for-cc");

  let count = page.getByTestId("count");
  let initialCount = Number(await count.textContent());
  await page.getByRole("button", { name: "Run action" }).click();

  await expect(count).toHaveText(String(initialCount + 1));
});
