import { expect, test } from "../test";

test("navigates to the search params example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "Search params" }).click();

  await expect(page).toHaveURL("/routing/search-params");
  await expect(
    page.getByRole("heading", { name: "Search params" }),
  ).toBeVisible();
});

test("navigates to foo search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params");
  await page.getByRole("link", { name: "?foo=bar", exact: true }).click();

  await expect(page).toHaveURL("/routing/search-params?foo=bar");
  await expect(page.getByTestId("server-search-params")).toHaveText("foo=bar");
  await expect(page.getByTestId("client-search-params")).toHaveText("foo=bar");

  verifyNoErrors();
});

test("navigates to abc search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params");
  await page.getByRole("link", { name: "?abc=123", exact: true }).click();

  await expect(page).toHaveURL("/routing/search-params?abc=123");
  await expect(page.getByTestId("server-search-params")).toHaveText("abc=123");
  await expect(page.getByTestId("client-search-params")).toHaveText("abc=123");

  verifyNoErrors();
});

test("navigates to multiple search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params");
  await page
    .getByRole("link", { name: "?foo=bar&abc=123", exact: true })
    .click();

  await expect(page).toHaveURL("/routing/search-params?foo=bar&abc=123");
  await expect(page.getByTestId("server-search-params")).toHaveText(
    "foo=bar&abc=123",
  );
  await expect(page.getByTestId("client-search-params")).toHaveText(
    "foo=bar&abc=123",
  );

  verifyNoErrors();
});

test("clears search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params?foo=bar&abc=123");
  await page.getByRole("link", { name: "(no search params)" }).click();

  await expect(page).toHaveURL("/routing/search-params");
  await expect(page.getByTestId("server-search-params")).toHaveText("None");
  await expect(page.getByTestId("client-search-params")).toHaveText("None");

  verifyNoErrors();
});

test("server-renders foo search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params?foo=bar");

  await expect(page.getByTestId("server-search-params")).toHaveText("foo=bar");
  await expect(page.getByTestId("client-search-params")).toHaveText("foo=bar");

  verifyNoErrors();
});

test("server-renders abc search params", async ({ page, verifyNoErrors }) => {
  await page.goto("/routing/search-params?abc=123");

  await expect(page.getByTestId("server-search-params")).toHaveText("abc=123");
  await expect(page.getByTestId("client-search-params")).toHaveText("abc=123");

  verifyNoErrors();
});

test("server-renders multiple search params", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/search-params?foo=bar&abc=123");

  await expect(page.getByTestId("server-search-params")).toHaveText(
    "foo=bar&abc=123",
  );
  await expect(page.getByTestId("client-search-params")).toHaveText(
    "foo=bar&abc=123",
  );

  verifyNoErrors();
});
