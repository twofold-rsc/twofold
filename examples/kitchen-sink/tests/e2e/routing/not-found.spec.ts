import { expect, test } from "../test";

test("navigates to the not found example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Not found" }).click();

  await expect(page).toHaveURL("/routing/not-found");
  await expect(
    page.getByText("Not found routing", { exact: true }),
  ).toBeVisible();
});

test("server-renders and hydrates the not found example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/not-found");

  await expect(
    page.getByText("Not found routing", { exact: true }),
  ).toBeVisible();
  verifyNoErrors();
});

test.describe("server", () => {
  test("renders a 404 for a direct visit to a missing page", async ({
    page,
  }) => {
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

  test("renders not found after delayed content calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found/delayed-not-found");

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

  test("renders a 404 when async middleware calls notFound", async ({
    page,
  }) => {
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

  test("uses the nearest custom not-found boundary", async ({ page }) => {
    let response = await page.goto("/routing/not-found/custom-not-found");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByText("This is a custom not found error", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Go back to not found index" })
      .click();
    await expect(page).toHaveURL("/routing/not-found");
    await expect(
      page.getByText("Not found routing", { exact: true }),
    ).toBeVisible();
  });

  test("renders not found after suspended content resolves", async ({
    page,
  }) => {
    await page.goto("/routing/not-found/suspended-not-found");

    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("You should not see this!", { exact: true }),
    ).toHaveCount(0);
  });
});

test.describe("client", () => {
  test("renders a 404 when navigating to a missing page", async ({ page }) => {
    await page.goto("/routing/not-found");

    await expect(
      page.getByText("Not found routing", { exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Page doesn't exist" }).click();

    await expect(page).toHaveURL(
      "/routing/not-found/missing-page-doesnt-exist",
    );
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to a page that calls notFound", async ({
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

  test("renders the custom not-found boundary when navigating", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Custom not found" }).click();

    await expect(page).toHaveURL("/routing/not-found/custom-not-found");
    await expect(
      page.getByText("This is a custom not found error", { exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to an async page that calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Async page calls notFound" }).click();

    await expect(page).toHaveURL(
      "/routing/not-found/async-page-calls-not-found",
    );
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to delayed content that calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Delayed notFound" }).click();

    await expect(page).toHaveURL("/routing/not-found/delayed-not-found");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to suspended content that calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Suspended notFound" }).click();

    await expect(page).toHaveURL("/routing/not-found/suspended-not-found");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to middleware that calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Middleware calls notFound" }).click();

    await expect(page).toHaveURL(
      "/routing/not-found/middleware-calls-not-found",
    );
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when navigating to async middleware that calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found");
    await page.getByRole("link", { name: "Async middleware notFound" }).click();

    await expect(page).toHaveURL(
      "/routing/not-found/async-middleware-not-found",
    );
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when a server action calls notFound", async ({
    page,
  }) => {
    await page.goto("/routing/not-found/action-calls-not-found");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("/routing/not-found/action-calls-not-found");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when a page calls notFound after an action", async ({
    page,
  }) => {
    await page.goto("/routing/not-found/not-found-after-action");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("/routing/not-found/not-found-after-action");
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });

  test("renders a 404 when middleware calls notFound after an action", async ({
    page,
  }) => {
    await page.goto("/routing/not-found/not-found-middleware-after-action");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL(
      "/routing/not-found/not-found-middleware-after-action",
    );
    await expect(
      page.getByRole("heading", { name: "Not found", exact: true }),
    ).toBeVisible();
  });
});
