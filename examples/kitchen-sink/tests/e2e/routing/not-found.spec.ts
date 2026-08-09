import { expect, test } from "../test";

test("renders a 404 for a direct visit to a missing page", async ({ page }) => {
  let response = await page.goto(
    "/routing/not-found/missing-page-doesnt-exist?source=direct",
  );

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(
    "/routing/not-found/missing-page-doesnt-exist?source=direct",
  );
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "/routing/not-found/missing-page-doesnt-exist?source=direct",
      { exact: true },
    ),
  ).toBeVisible();
});

test("renders a 404 when a page calls notFound", async ({ page }) => {
  let response = await page.goto(
    "/routing/not-found/page-calls-not-found?source=direct",
  );

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(
    "/routing/not-found/page-calls-not-found?source=direct",
  );
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You should not see this!", { exact: true }),
  ).toHaveCount(0);
});

test("renders a 404 when an async page calls notFound", async ({ page }) => {
  let response = await page.goto(
    "/routing/not-found/async-page-calls-not-found?source=direct",
  );

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(
    "/routing/not-found/async-page-calls-not-found?source=direct",
  );
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You should not see this!", { exact: true }),
  ).toHaveCount(0);
});

test("renders a 404 when middleware calls notFound", async ({ page }) => {
  let response = await page.goto(
    "/routing/not-found/middleware-calls-not-found?source=direct",
  );

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(
    "/routing/not-found/middleware-calls-not-found?source=direct",
  );
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You should not see this!", { exact: true }),
  ).toHaveCount(0);
});

test("renders a 404 when async middleware calls notFound", async ({ page }) => {
  let response = await page.goto(
    "/routing/not-found/async-middleware-not-found?source=direct",
  );

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(
    "/routing/not-found/async-middleware-not-found?source=direct",
  );
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You should not see this!", { exact: true }),
  ).toHaveCount(0);
});

test("navigates to a missing page from the menu", async ({ page }) => {
  await page.goto("/routing/not-found");

  await expect(
    page.getByText("Not found routing", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Page doesn't exist" }).click();

  await expect(page).toHaveURL("/routing/not-found/missing-page-doesnt-exist");
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
});

test("navigates to a page that calls notFound from the menu", async ({
  page,
}) => {
  await page.goto("/routing/not-found");
  await page
    .getByRole("link", { name: "Page calls notFound", exact: true })
    .click();

  await expect(page).toHaveURL("/routing/not-found/page-calls-not-found");
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
});

test("uses the nearest custom not-found boundary", async ({ page }) => {
  let response = await page.goto("/routing/not-found/custom-not-found");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByText("This is a custom not found error", { exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Go back to not found index" }).click();
  await expect(page).toHaveURL("/routing/not-found");
  await expect(
    page.getByText("Not found routing", { exact: true }),
  ).toBeVisible();
});

test("shows not found after a server action", async ({ page }) => {
  await page.goto("/routing/not-found/action-calls-not-found");
  await page.getByRole("button", { name: "Run action" }).click();

  await expect(page).toHaveURL("/routing/not-found/action-calls-not-found");
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
});

test("renders not found after suspended content resolves", async ({ page }) => {
  await page.goto("/routing/not-found/suspended-not-found");

  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You should not see this!", { exact: true }),
  ).toHaveCount(0);
});

test.skip("todo: observe the loading fallback before suspended notFound resolves", async () => {});

test.skip("todo: assert the HTTP status when notFound occurs after streamed headers are committed", async () => {});
