import { expect, test } from "../test";

test("navigates to the client component example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Client components" }).click();
  await page.getByText("Client component", { exact: true }).click();

  await expect(page).toHaveURL("/client-components");
  await expect(
    page.getByRole("heading", { name: "Client component" }),
  ).toBeVisible();
});

test("server-renders and hydrates the client component example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/client-components");

  await expect(
    page.getByText("A component that runs on the client."),
  ).toBeVisible();
  await expect(page.getByText("0", { exact: true })).toBeVisible();

  verifyNoErrors();
});

test("updates the client component counter", async ({ page }) => {
  await page.goto("/client-components");

  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "-" }).click();
  await expect(page.getByText("0", { exact: true })).toBeVisible();
});
