import { expect, test } from "../test";

test(
  "shows error details in development",
  { tag: "@development" },
  async ({ page }) => {
    await page.goto("/error-handling/boundary/throws");

    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    await expect(page.getByTestId("error-message")).toHaveText(
      "Could not connect to database with password: p@$$w0rd!",
    );
    await expect(page.getByText("Stack trace", { exact: true })).toBeVisible();
    await expect(page.getByTestId("error-digest")).not.toBeVisible();
  },
);

test(
  "hides error details in production",
  { tag: "@production" },
  async ({ page }) => {
    await page.goto("/error-handling/boundary/throws");

    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    await expect(page.getByTestId("error-message")).not.toContainText(
      "Could not connect to database",
    );
    await expect(page.getByTestId("error-message")).not.toContainText(
      "p@$$w0rd!",
    );
    await expect(page.getByTestId("error-message")).toHaveText(
      /specific message is omitted in production builds/i,
    );
    await expect(page.getByTestId("error-stack")).not.toContainText(
      "Could not connect to database",
    );
    await expect(page.getByTestId("error-stack")).not.toContainText(
      "throws.page",
    );
    await expect(page.getByTestId("error-digest")).toHaveText(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  },
);

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
