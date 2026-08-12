import { expect, test } from "../test";

test("renders feedback when middleware throws", async ({ page }) => {
  await page.goto("/error-handling/middleware/middleware-throw");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Crash!");
});

test("renders feedback when navigating to middleware that throws", async ({
  page,
}) => {
  await page.goto("/error-handling/middleware");
  await page
    .getByRole("link", { name: "Middleware throw", exact: true })
    .click();

  await expect(page).toHaveURL("/error-handling/middleware/middleware-throw");
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Crash!");
});

test("renders feedback when async middleware throws", async ({ page }) => {
  await page.goto("/error-handling/middleware/async-middleware-throw");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Crash!");
});

test("renders feedback when navigating to async middleware that throws", async ({
  page,
}) => {
  await page.goto("/error-handling/middleware");
  await page
    .getByRole("link", { name: "Async middleware throw", exact: true })
    .click();

  await expect(page).toHaveURL(
    "/error-handling/middleware/async-middleware-throw",
  );
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Crash!");
});
