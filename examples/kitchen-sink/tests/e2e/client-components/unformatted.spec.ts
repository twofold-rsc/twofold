import { expect, test } from "../test";

test("navigates to the unformatted client component example", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Client components" }).click();
  await page.getByRole("link", { name: "Unformatted files" }).click();

  await expect(page).toHaveURL("/client-components/unformatted");
  await expect(
    page.getByRole("heading", { name: "Unformatted" }),
  ).toBeVisible();
});

test("server-renders and hydrates the unformatted client component", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/client-components/unformatted");

  await expect(
    page.getByText(
      "A file that contains client components without formatting.",
    ),
  ).toBeVisible();
  await expect(page.getByText("0", { exact: true })).toBeVisible();

  verifyNoErrors();
});

test("updates the unformatted client component counter", async ({ page }) => {
  await page.goto("/client-components/unformatted");

  await page.getByRole("button", { name: "+" }).click();
  await expect(page.getByText("1", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "-" }).click();
  await expect(page.getByText("0", { exact: true })).toBeVisible();
});
