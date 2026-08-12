import { expect, test } from "../test";

test("navigates to the unauthorized example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Unauthorized" }).click();

  await expect(page).toHaveURL("/routing/unauthorized");
  await expect(
    page.getByText("Unautorized index route", { exact: true }),
  ).toBeVisible();
});

test("server-renders and hydrates the unauthorized example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/unauthorized");

  await expect(
    page.getByText("Unautorized index route", { exact: true }),
  ).toBeVisible();
  verifyNoErrors();
});

test.describe("server", () => {
  test("renders a 401 when a page calls unauthorized", async ({ page }) => {
    let response = await page.goto(
      "/routing/unauthorized/page-calls-unauthorized?source=direct",
    );

    expect(response?.status()).toBe(401);
    await expect(page).toHaveURL(
      "/routing/unauthorized/page-calls-unauthorized?source=direct",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("You shouldn't see this", { exact: true }),
    ).toHaveCount(0);
  });

  test("renders unauthorized when an async page calls unauthorized", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized/async-unauthorized?source=direct");

    await expect(page).toHaveURL(
      "/routing/unauthorized/async-unauthorized?source=direct",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });

  test("renders a 401 when middleware calls unauthorized", async ({ page }) => {
    let response = await page.goto(
      "/routing/unauthorized/middleware-calls-unauthorized?source=direct",
    );

    expect(response?.status()).toBe(401);
    await expect(page).toHaveURL(
      "/routing/unauthorized/middleware-calls-unauthorized?source=direct",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("You shouldn't see this", { exact: true }),
    ).toHaveCount(0);
  });

  test("uses the nearest custom unauthorized boundary", async ({ page }) => {
    let response = await page.goto("/routing/unauthorized/custom-unauthorized");

    expect(response?.status()).toBe(401);
    await expect(
      page.getByText("This is a custom unauthorized page.", { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Unauthorized index" }).click();
    await expect(page).toHaveURL("/routing/unauthorized");
    await expect(
      page.getByText("Unautorized index route", { exact: true }),
    ).toBeVisible();
  });

  test("renders unauthorized after suspended content resolves", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized/suspended-unauthorized");

    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("You should not see this!", { exact: true }),
    ).toHaveCount(0);
  });
});

test.describe("client", () => {
  test("renders unauthorized when navigating to a page that calls unauthorized", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized");
    await page.getByRole("link", { name: "Page calls unauthorized" }).click();

    await expect(page).toHaveURL(
      "/routing/unauthorized/page-calls-unauthorized",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });

  test("renders unauthorized when navigating to an async page", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized");
    await page.getByRole("link", { name: "Async unauthorized" }).click();

    await expect(page).toHaveURL("/routing/unauthorized/async-unauthorized");
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });

  test("renders unauthorized when navigating to middleware that calls unauthorized", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized");
    await page
      .getByRole("link", { name: "Middleware calls unauthorized" })
      .click();

    await expect(page).toHaveURL(
      "/routing/unauthorized/middleware-calls-unauthorized",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });

  test("renders the custom unauthorized boundary when navigating", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized");
    await page.getByRole("link", { name: "Custom unauthorized" }).click();

    await expect(page).toHaveURL("/routing/unauthorized/custom-unauthorized");
    await expect(
      page.getByText("This is a custom unauthorized page.", { exact: true }),
    ).toBeVisible();
  });

  test("renders unauthorized after navigating to suspended content", async ({
    page,
  }) => {
    await page.goto("/routing/unauthorized");
    await page.getByRole("link", { name: "Suspended unauthorized" }).click();

    await expect(page).toHaveURL(
      "/routing/unauthorized/suspended-unauthorized",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });

  test("renders unauthorized after a server action", async ({ page }) => {
    await page.goto("/routing/unauthorized/action-calls-unauthorized");
    await page.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL(
      "/routing/unauthorized/action-calls-unauthorized",
    );
    await expect(
      page.getByRole("heading", { name: "Not authorized", exact: true }),
    ).toBeVisible();
  });
});
