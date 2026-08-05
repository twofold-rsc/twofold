import { expect, test } from "../test";

test("navigates to the named exports example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Client components" }).click();
  await page.getByRole("link", { name: "Named exports" }).click();

  await expect(page).toHaveURL("/client-components/named-exports");
  await expect(
    page.getByRole("heading", { name: "Named exports" }),
  ).toBeVisible();
});

test("server-renders and hydrates the named exports example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/client-components/named-exports");

  await expect(page.getByText("Counter", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Text to Uppercase", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add 1" })).toBeVisible();
  await expect(page.getByPlaceholder("Enter text")).toBeVisible();

  verifyNoErrors();
});

test("updates the default-exported client component", async ({ page }) => {
  await page.goto("/client-components/named-exports");

  await page.getByRole("button", { name: "Add 1" }).click();
  await expect(page.getByText("1", { exact: true })).toBeVisible();
});

test("updates the named-exported client component", async ({ page }) => {
  await page.goto("/client-components/named-exports");

  await page.getByPlaceholder("Enter text").fill("hello");
  await expect(page.getByText("HELLO", { exact: true })).toBeVisible();
});
