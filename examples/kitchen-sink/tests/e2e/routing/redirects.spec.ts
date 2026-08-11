import { expect, test } from "../test";

test("navigates to the redirect examples", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Redirects" }).click();

  await expect(page).toHaveURL("/routing/redirects");
  await expect(
    page.getByRole("heading", { name: "Redirects", exact: true }),
  ).toBeVisible();
});

test("server-renders and hydrates the redirect examples", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/redirects");

  await expect(
    page.getByRole("heading", { name: "Redirects", exact: true }),
  ).toBeVisible();
  verifyNoErrors();
});

test.describe("server", () => {
  test("redirects a direct visit when a page calls redirect", async ({
    page,
  }) => {
    await page.goto("/routing/redirects/page-redirect");

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
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

  test("redirects a direct visit to another domain", async ({ request }) => {
    let response = await request.get(
      "/routing/redirects/redirect-to-another-domain",
      { maxRedirects: 0 },
    );

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe("https://github.com/");
  });

  test("redirects a direct visit after suspended content resolves", async ({
    page,
  }) => {
    await page.goto("/routing/redirects/suspended-redirect");

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
    ).toBeVisible();
  });

  test("redirects a direct visit to the not-found page", async ({ page }) => {
    await page.goto("/routing/redirects/redirect-not-found");

    await expect(page).toHaveURL("/routing/redirects/this-page-doesnt-exist");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("redirects a direct visit from middleware", async ({ page }) => {
    await page.goto("/routing/redirects/middleware-redirect");

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
    ).toBeVisible();
  });
});

test.describe("client", () => {
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

  test("redirects after navigating to a delayed page", async ({ page }) => {
    await page.goto("/routing/redirects");
    await page
      .getByRole("link", { name: "Delayed page calls redirect" })
      .click();

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
    ).toBeVisible();
  });

  test("permanently redirects after navigation", async ({ page }) => {
    await page.goto("/routing/redirects");
    await page.getByRole("link", { name: "Permanent redirect" }).click();

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
    ).toBeVisible();
  });

  test("redirects after navigation to another domain", async ({ page }) => {
    await page.goto("/routing/redirects");
    await page
      .getByRole("link", { name: "Redirect to another domain", exact: true })
      .click();

    await expect(page).toHaveURL("https://github.com/");
  });

  test("redirects after suspended content resolves", async ({ page }) => {
    await page.goto("/routing/redirects");
    await page.getByRole("link", { name: "Suspended redirect" }).click();

    await expect(page).toHaveURL("/routing/redirects/ending");
    await expect(
      page.getByRole("heading", { name: "Redirected", exact: true }),
    ).toBeVisible();
  });

  test("redirects after navigating to the not-found page", async ({ page }) => {
    await page.goto("/routing/redirects");
    await page.getByRole("link", { name: "Redirect to not found" }).click();

    await expect(page).toHaveURL("/routing/redirects/this-page-doesnt-exist");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
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

  test("redirects an action to another domain", async ({ page }) => {
    await page.goto("/routing/redirects/action-redirect-to-another-domain");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("https://github.com/");
  });

  test("redirects an action to the not-found page", async ({ page }) => {
    await page.goto("/routing/redirects/action-redirect-not-found");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("/routing/redirects/this-page-doesnt-exist");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });
});
