import { expect, test } from "../test";

test("navigates to the nested layouts example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: /^Nested layouts/ }).click();

  await expect(page).toHaveURL("/routing/nested-layouts");
  await expect(
    page.getByRole("heading", { name: "Nested layouts" }),
  ).toBeVisible();
});

test("server-renders and hydrates nested layouts", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/nested-layouts/level-2");

  await expect(
    page.getByRole("heading", { name: "Nested layouts" }),
  ).toBeVisible();
  await expect(page.getByText("Nested layout", { exact: true })).toBeVisible();
  await expect(page.getByText("Level 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go back" })).toBeVisible();
  verifyNoErrors();
});

test("navigates between nested layouts", async ({ page }) => {
  await page.goto("/routing/nested-layouts");

  await page.getByRole("link", { name: "Go to level 2" }).click();

  await expect(page).toHaveURL("/routing/nested-layouts/level-2");
  await expect(page.getByText("Level 2", { exact: true })).toBeVisible();
});

test("preserves client component state while navigating child pages", async ({
  page,
}) => {
  await page.goto("/routing/nested-layouts");

  await page.getByRole("button", { name: "Add 1" }).click();
  await page.getByRole("link", { name: "Go to level 2" }).click();

  await expect(page.getByTestId("nested-layout-counter")).toHaveText("1");
});

test("preserves browser element state while navigating child pages", async ({
  page,
}) => {
  await page.goto("/routing/nested-layouts");

  let input = page.getByRole("textbox");
  await input.fill("preserved browser state");
  await page.getByRole("link", { name: "Go to level 2" }).click();

  await expect(input).toHaveValue("preserved browser state");
});

test("preserves server action state while navigating child pages", async ({
  page,
}) => {
  await page.goto("/routing/nested-layouts");

  let result = page.getByTestId("nested-layout-action-result");
  await page.getByRole("button", { name: "Run action" }).click();
  await expect(result).toHaveText(/^Result \d+$/);
  let actionResult = await result.textContent();

  await page.getByRole("link", { name: "Go to level 2" }).click();

  await expect(result).toHaveText(actionResult ?? "");
});
