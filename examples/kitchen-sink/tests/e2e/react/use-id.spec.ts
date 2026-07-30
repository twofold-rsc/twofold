import { expect, test } from "../test";

test("navigates to the useId example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "useId" }).click();

  await expect(page).toHaveURL("/react/use-id");
  await expect(page.getByText(/^id:/)).toHaveCount(2);
});

test("server-renders and hydrates the useId example", async ({
  page,
  verifyNoHydrationErrors,
}) => {
  await page.goto("/react/use-id");

  await expect(page.getByText(/^id:/)).toHaveCount(2);
  verifyNoHydrationErrors();
});
