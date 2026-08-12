import { expect, test } from "../test";

test("renders the custom error boundary", async ({ page }) => {
  await page.goto("/error-handling/boundary/throws");

  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText(
    "Could not connect to database",
  );
});

test("renders the custom error boundary after navigation", async ({ page }) => {
  await page.goto("/error-handling/boundary");
  await page
    .getByRole("link", { name: "Visit a page that errors", exact: true })
    .click();

  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
});

test("resets the custom error boundary", async ({ page }) => {
  await page.goto("/error-handling/boundary/throws");

  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page).toHaveURL("/error-handling/boundary");
  await expect(
    page.getByRole("heading", { name: "Error boundaries" }),
  ).toBeVisible();
});
