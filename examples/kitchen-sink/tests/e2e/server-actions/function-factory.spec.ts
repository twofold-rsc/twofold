import { expect, test } from "../test";

test("navigates to the action factory example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Action factory", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/function-factory");
  await expect(
    page.getByRole("heading", { name: "Action factory" }),
  ).toBeVisible();
});

test("server-renders and hydrates the action factory example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/function-factory");

  await expect(page.getByText(/^Count: \d+$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run increment by 1" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run increment by 3" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("runs the increment by 1 action created by the factory", async ({
  page,
}) => {
  await page.goto("/server-actions/function-factory");

  let count = page.getByTestId("count");
  let initialCount = Number(await count.textContent());
  await page.getByRole("button", { name: "Run increment by 1" }).click();

  await expect(count).toHaveText(String(initialCount + 1));
});

test("runs the increment by 3 action created by the factory", async ({
  page,
}) => {
  await page.goto("/server-actions/function-factory");

  let count = page.getByTestId("count");
  let initialCount = Number(await count.textContent());
  await page.getByRole("button", { name: "Run increment by 3" }).click();

  await expect(count).toHaveText(String(initialCount + 3));
});
