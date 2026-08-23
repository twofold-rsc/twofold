import { expect, test } from "../test";

test("navigates to the pathless routes example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Pathless routes" }).click();

  await expect(page).toHaveURL("/routing/pathless");
  await expect(
    page.getByRole("heading", { name: "Pathless layout" }),
  ).toBeVisible();
});

test.describe("navigation", () => {
  test("routes index links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Index", exact: true }).click();
    await expect(page).toHaveURL("/routing/pathless");
    await expect(
      page.getByText("Pathless index", { exact: true }),
    ).toBeVisible();
  });

  test("routes fixed page links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Fixed page", exact: true }).click();
    await expect(page).toHaveURL("/routing/pathless/fixed");
    await expect(
      page.getByText("Pathless fixed page", { exact: true }),
    ).toBeVisible();
  });

  test("routes dynamic 1 links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Dynamic 1", exact: true }).click();
    await expect(page).toHaveURL("/routing/pathless/1");
    await expect(
      page.getByText("Dynamic page: 1", { exact: true }),
    ).toBeVisible();
  });

  test("routes dynamic 2 links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Dynamic 2", exact: true }).click();
    await expect(page).toHaveURL("/routing/pathless/2");
    await expect(
      page.getByText("Dynamic page: 2", { exact: true }),
    ).toBeVisible();
  });

  test("routes dashed dynamic links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Dashed dynamic" }).click();
    await expect(page).toHaveURL("/routing/pathless/dashed/hello-world");
    await expect(
      page.getByText("Dashed dynamic page: hello-world", { exact: true }),
    ).toBeVisible();
  });

  test("calls an API nested under a pathless route from the page", async ({
    page,
  }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "API route" }).click();
    await expect(page).toHaveURL("/routing/pathless/api");
    await expect(page.getByText("Pathless API", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Fetch API" }).click();
    await expect(
      page.getByText("Hello from the API route!", { exact: true }),
    ).toBeVisible();
  });

  test("routes wildcard links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Wildcard 1", exact: true }).click();
    await expect(page).toHaveURL("/routing/pathless/wildcard/1");
    await expect(
      page.getByText("Wildcard page: wildcard/1", { exact: true }),
    ).toBeVisible();
  });

  test("routes subroute index links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Subroute index" }).click();
    await expect(page).toHaveURL("/routing/pathless/subroute");
    await expect(
      page.getByText("Subroute index page", { exact: true }),
    ).toBeVisible();
  });

  test("routes subroute fixed links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Subroute fixed" }).click();
    await expect(page).toHaveURL("/routing/pathless/subroute/fixed");
    await expect(
      page.getByText("Subroute fixed page", { exact: true }),
    ).toBeVisible();
  });

  test("routes subroute dynamic 1 links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Subroute dynamic 1" }).click();
    await expect(page).toHaveURL("/routing/pathless/subroute/1");
    await expect(
      page.getByText("Subroute dynamic page: 1", { exact: true }),
    ).toBeVisible();
  });

  test("routes subroute dynamic 2 links", async ({ page }) => {
    await page.goto("/routing/pathless");

    await page.getByRole("link", { name: "Subroute dynamic 2" }).click();
    await expect(page).toHaveURL("/routing/pathless/subroute/2");
    await expect(
      page.getByText("Subroute dynamic page: 2", { exact: true }),
    ).toBeVisible();
  });
});

test.describe("direct access", () => {
  test("server-renders the index", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/pathless");

    await expect(
      page.getByText("Pathless index", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the fixed page", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/pathless/fixed");

    await expect(
      page.getByText("Pathless fixed page", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders dynamic 1", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/pathless/1");

    await expect(
      page.getByText("Dynamic page: 1", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders dynamic 2", async ({ page, verifyNoErrors }) => {
    await page.goto("/routing/pathless/2");

    await expect(
      page.getByText("Dynamic page: 2", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the dashed dynamic route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/dashed/hello-world");

    await expect(
      page.getByText("Dashed dynamic page: hello-world", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("returns the pathless API response", async ({ request }) => {
    let response = await request.post("/routing/pathless/api");

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe("Hello from the API route!");
  });

  test("server-renders the wildcard route", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/wildcard/1");

    await expect(
      page.getByText("Wildcard page: wildcard/1", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the subroute index", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/subroute");

    await expect(
      page.getByText("Subroute index page", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders the subroute fixed page", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/subroute/fixed");

    await expect(
      page.getByText("Subroute fixed page", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders subroute dynamic 1", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/subroute/1");

    await expect(
      page.getByText("Subroute dynamic page: 1", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });

  test("server-renders subroute dynamic 2", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/routing/pathless/subroute/2");

    await expect(
      page.getByText("Subroute dynamic page: 2", { exact: true }),
    ).toBeVisible();
    verifyNoErrors();
  });
});
