import { expect, test } from "../test";

test("navigates to the form data example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Form data", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/form-data");
  await expect(
    page.getByRole("heading", { name: "Form data" }),
  ).toBeVisible();
});

test("server-renders and hydrates the form data example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/form-data");

  await expect(page.getByText(/^The name on the server is .+$/)).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();

  verifyNoErrors();
});

test("updates the name with form data", async ({ page }) => {
  await page.goto("/server-actions/form-data");
  await page.getByRole("textbox").fill("bob");
  await page.getByRole("button", { name: "Update name" }).click();

  await expect(page.getByTestId("server-name")).toHaveText("bob");
});
