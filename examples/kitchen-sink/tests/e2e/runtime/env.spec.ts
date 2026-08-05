import { expect, test } from "../test";

test("navigates to the environment variables example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Runtime" }).click();
  await page.getByText("ENVs", { exact: true }).click();

  await expect(page).toHaveURL("/runtime/env");
  await expect(page.getByRole("heading", { name: "ENV" })).toBeVisible();
});

test("keeps environment variables on the server", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/runtime/env");

  await expect(page.getByTestId("server-env-value")).toHaveText(
    "this-should-be-a-string",
  );
  await expect(page.getByTestId("client-env-value")).toHaveText("Not set");

  verifyNoErrors();
});

test("sets NODE_ENV to development in client components", async ({ page }) => {
  await page.goto("/runtime/env");

  await expect(page.getByTestId("client-node-env-value")).toHaveText(
    "development",
  );
});
