import { expect, test } from "../test";

test("navigates to the bound form data example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Bound form data", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/form-data-bound");
  await expect(
    page.getByRole("heading", { name: "Bound form data" }),
  ).toBeVisible();
});

test("server-renders and hydrates the bound form data example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/form-data-bound");

  await expect(
    page.getByText(/^The value on the server is .+$/),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(2);

  verifyNoErrors();
});

test("submits the name with bound form data", async ({ page }) => {
  await page.goto("/server-actions/form-data-bound");

  let form = page.getByRole("heading", { name: "Form #2" }).locator("..");
  await form.getByRole("textbox").fill("carol");
  await form.getByRole("button", { name: "Update name" }).click();

  await expect(page.getByTestId("server-value")).toHaveText(
    "Name is carol, set by form #2",
  );
});

test("submits form #2 and then form #1", async ({ page }) => {
  await page.goto("/server-actions/form-data-bound");

  let formTwo = page
    .getByRole("heading", { name: "Form #2" })
    .locator("..");
  await formTwo.getByRole("textbox").fill("bob");
  await formTwo.getByRole("button", { name: "Update name" }).click();
  await expect(page.getByTestId("server-value")).toHaveText(
    "Name is bob, set by form #2",
  );

  let formOne = page
    .getByRole("heading", { name: "Form #1" })
    .locator("..");
  await formOne.getByRole("textbox").fill("alice");
  await formOne.getByRole("button", { name: "Update name" }).click();
  await expect(page.getByTestId("server-value")).toHaveText(
    "Name is alice, set by form #1",
  );
});
