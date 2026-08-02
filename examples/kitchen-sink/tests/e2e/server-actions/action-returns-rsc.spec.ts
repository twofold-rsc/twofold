import { expect, test } from "../test";

test("navigates to the action returns RSC example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Action returns RSC", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/action-returns-rsc");
  await expect(
    page.getByRole("heading", {
      name: "Action that returns a server component",
    }),
  ).toBeVisible();
});

test("server-renders and hydrates the action returns RSC example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/action-returns-rsc");

  await expect(
    page.getByText("Run the action to see the component"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Get RSC", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Get RSC with children" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("renders the server component returned by the action", async ({ page }) => {
  await page.goto("/server-actions/action-returns-rsc");

  await page.getByRole("button", { name: "Get RSC", exact: true }).click();
  await expect(page.getByText("Component is loading...")).toBeVisible();
  await expect(page.getByText(/^It is .+ on the server$/)).toBeVisible();
});

test("renders the server component with children returned by the action", async ({
  page,
}) => {
  await page.goto("/server-actions/action-returns-rsc");

  await page.getByRole("button", { name: "Get RSC with children" }).click();
  await expect(page.getByText("Component is loading...")).toBeVisible();
  await expect(page.getByText("This component should be blue")).toBeVisible();
});
