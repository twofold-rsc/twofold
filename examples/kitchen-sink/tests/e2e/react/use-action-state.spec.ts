import { expect, test } from "../test";

test("navigates to the useActionState example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "useActionState" }).click();

  await expect(page).toHaveURL("/react/use-action-state");
  await expect(
    page.getByRole("heading", { name: "useActionState" }),
  ).toBeVisible();
});

test("server-renders and hydrates the useActionState example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/react/use-action-state");

  await expect(
    page.getByText("You have not yet submitted the form"),
  ).toBeVisible();

  verifyNoErrors();
});

test("shows the successful action state after submitting the form", async ({
  page,
}) => {
  await page.goto("/react/use-action-state");

  await page.getByPlaceholder("Enter a name").fill("alice");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText('Form submitting with "alice"')).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  await expect(page.getByText("Success!")).toBeVisible();
});

test("shows the validation error after submitting an invalid name", async ({
  page,
}) => {
  await page.goto("/react/use-action-state");

  await page.getByPlaceholder("Enter a name").fill("bob");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Name must be 'alice'")).toBeVisible();
});
