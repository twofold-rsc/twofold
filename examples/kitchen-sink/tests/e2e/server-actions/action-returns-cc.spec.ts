import { expect, test } from "../test";

test("navigates to the action returns CC example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Action returns CC", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/action-returns-cc");
  await expect(
    page.getByRole("heading", {
      name: "Action that returns a client component",
    }),
  ).toBeVisible();
});

test("server-renders and hydrates the action returns CC example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/action-returns-cc");

  await expect(
    page.getByText("Run the action to see the component"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Run action" })).toBeVisible();

  verifyNoErrors();
});

test("renders the client component returned by the action", async ({ page }) => {
  await page.goto("/server-actions/action-returns-cc");

  await page.getByRole("button", { name: "Run action" }).click();
  await expect(page.getByText("Component is loading...")).toBeVisible();
  await expect(page.getByText("Look, a client component!")).toBeVisible();
});
