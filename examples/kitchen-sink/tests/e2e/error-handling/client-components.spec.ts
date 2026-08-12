import { expect, test } from "../test";

test("renders feedback when a client component throws", async ({ page }) => {
  await page.goto("/error-handling/client-components/cc-throws-in-browser");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("renders feedback when navigating to a throwing client component", async ({
  page,
}) => {
  await page.goto("/error-handling/client-components");
  await page
    .getByRole("link", { name: "Client browser error", exact: true })
    .click();

  await expect(page).toHaveURL(
    "/error-handling/client-components/cc-throws-in-browser",
  );
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});
