import { expect, test } from "../test";

test("navigates to the slow action example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Slow action", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/slow-function");
  await expect(
    page.getByRole("heading", { name: "Slow action" }),
  ).toBeVisible();
});

test("server-renders and hydrates the slow action example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/slow-function");

  await expect(page.getByTestId("result")).toHaveText("Result:");
  await expect(
    page.getByRole("button", { name: "Run slow action" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("shows a result after the slow action completes", async ({ page }) => {
  await page.goto("/server-actions/slow-function");

  let button = page.getByRole("button", { name: "Run slow action" });
  await button.click();
  await expect(button).toBeDisabled();
  await expect(page.getByTestId("result")).toHaveText(/^Result: .+$/);
});

test("navigates home while the slow action is running", async ({ page }) => {
  await page.goto("/server-actions/slow-function");

  await page.getByRole("button", { name: "Run slow action" }).click();
  await page.getByRole("button", { name: "Twofold" }).click();
  await page.getByText("Home", { exact: true }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Welcome", { exact: true })).toBeVisible();
});
