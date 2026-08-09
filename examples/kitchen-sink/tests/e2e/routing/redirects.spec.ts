import { expect, test } from "../test";

test("redirects a direct visit when a page calls redirect", async ({
  page,
}) => {
  await page.goto("/routing/redirects/page-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("You were redirected here!", { exact: true }),
  ).toBeVisible();
});

test("redirects a direct visit when an async page calls redirect", async ({
  page,
}) => {
  await page.goto("/routing/redirects/async-page-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects a direct visit after a page delay", async ({ page }) => {
  await page.goto("/routing/redirects/delayed-page-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("permanently redirects a direct visit", async ({ page }) => {
  await page.goto("/routing/redirects/permanent-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects a direct visit from middleware", async ({ page }) => {
  await page.goto("/routing/redirects/middleware-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects after navigating to a page that calls redirect", async ({
  page,
}) => {
  await page.goto("/routing/redirects");
  await page
    .getByRole("link", { name: "Page calls redirect", exact: true })
    .click();

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects after navigating to an async page that calls redirect", async ({
  page,
}) => {
  await page.goto("/routing/redirects");
  await page
    .getByRole("link", { name: "Async page calls redirect", exact: true })
    .click();

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects after navigating to redirecting middleware", async ({
  page,
}) => {
  await page.goto("/routing/redirects");
  await page
    .getByRole("link", { name: "Middleware calls redirect", exact: true })
    .click();

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects after a server action", async ({ page }) => {
  await page.goto("/routing/redirects/action-redirect");
  await page.getByRole("button", { name: "Run action" }).click();

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects during revalidation after a server action", async ({
  page,
}) => {
  await page.goto("/routing/redirects/redirect-in-render-after-action");
  await page.getByRole("button", { name: "Run action" }).click();

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test("redirects a typed useActionState action to the current route", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/redirects/uas-typed-redirect");
  let button = page.getByRole("button", { name: "Run action" });
  await button.click();

  await expect(page).toHaveURL("/routing/redirects/uas-typed-redirect");
  await expect(button).toBeEnabled();
  await expect(page.getByText("State: test", { exact: true })).toBeVisible();
  verifyNoErrors();
});

test("redirects after repeated useActionState actions", async ({ page }) => {
  await page.goto("/routing/redirects/uas-redirect");
  let button = page.getByRole("button", { name: "Run action" });

  await button.click();
  await expect(page.getByText("Times run: 1", { exact: true })).toBeVisible();
  await button.click();
  await expect(page.getByText("Times run: 2", { exact: true })).toBeVisible();
  await button.click();

  await expect(page).toHaveURL("/routing/redirects/ending");
});

test("redirects after suspended content resolves", async ({ page }) => {
  await page.goto("/routing/redirects/suspended-redirect");

  await expect(page).toHaveURL("/routing/redirects/ending");
  await expect(
    page.getByRole("heading", { name: "Redirected", exact: true }),
  ).toBeVisible();
});

test.skip("todo: observe the loading fallback before a suspended redirect resolves", async () => {});

test("redirects to the not-found page", async ({ page }) => {
  await page.goto("/routing/redirects/redirect-not-found");

  await expect(page).toHaveURL("/routing/redirects/this-page-doesnt-exist");
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
});

test("redirects an action to the not-found page", async ({ page }) => {
  await page.goto("/routing/redirects/action-redirect-not-found");
  await page.getByRole("button", { name: "Run action" }).click();

  await expect(page).toHaveURL("/routing/redirects/this-page-doesnt-exist");
  await expect(
    page.getByRole("heading", { name: "Not found", exact: true }),
  ).toBeVisible();
});

test.skip("todo: assert temporary and permanent redirect status codes without the request fixture", async () => {});

test.skip("todo: cover page and action redirects to another domain without external network dependence", async () => {});
