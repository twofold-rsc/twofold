import { expect, test } from "../test";

test("shows an error when a page passes a non-action function to a component", async ({
  page,
}) => {
  await page.goto("/error-handling/server-actions/action-missing-use-server");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("use server");
});

test("shows an error when navigating to a page that passes a non-action function to a component", async ({
  page,
}) => {
  await page.goto("/error-handling/server-actions");
  await page
    .getByRole("link", {
      name: "Server action missing use server",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("use server");
});

test("shows an error when a server action throws", async ({ page }) => {
  await page.goto("/error-handling/server-actions/action-throw");
  await page.getByRole("button", { name: "Fire action" }).click();

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when a server action causes a page error", async ({
  page,
}) => {
  await page.goto("/error-handling/server-actions/action-causes-page-error");
  await page.getByRole("button", { name: "Fire action" }).click();

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Render error");
});

test("allows a client component to catch a server action error", async ({
  page,
}) => {
  await page.goto("/error-handling/server-actions/action-throw-client-catch");
  await page.getByRole("button", { name: "Fire action" }).click();

  await expect(
    page.getByText("Caught an error...", { exact: true }),
  ).toBeVisible();
});
