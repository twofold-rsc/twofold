import { expect, test } from "../test";

test("navigates to the useOptimisticRoute example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByRole("link", { name: "useOptimisticRoute" }).click();

  await expect(page).toHaveURL("/routing/use-optimistic-route");
  await expect(page.getByText("Optimistic route index")).toBeVisible();
});

test("server-renders and hydrates route state", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/use-optimistic-route/slow-page-start");

  await expect(
    page.getByRole("heading", { name: "Slow start page" }),
  ).toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Current path:" }),
  ).toContainText("/routing/use-optimistic-route/slow-page-start");
  await expect(
    page.getByRole("row").filter({ hasText: "Router is transitioning:" }),
  ).toContainText("NO");

  verifyNoErrors();
});

test("exposes the destination while a slow route is loading", async ({
  page,
}) => {
  await page.goto("/routing/use-optimistic-route/slow-page-start");
  await page.getByRole("link", { name: "slow page", exact: true }).click();

  await expect(
    page.getByRole("row").filter({ hasText: "Router is transitioning:" }),
  ).toContainText("YES");
  await expect(
    page.getByRole("row").filter({ hasText: "Optimistic path:" }),
  ).toContainText("/routing/use-optimistic-route/slow-page-end");
  await expect(
    page.getByRole("row").filter({ hasText: "Optimistic search params:" }),
  ).toContainText("a=query");
  await expect(
    page.getByRole("heading", { name: "Slow end page" }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    "/routing/use-optimistic-route/slow-page-end?a=query",
  );
});

test("optimistically navigates while a slow action is running", async ({
  page,
}) => {
  await page.goto("/routing/use-optimistic-route/nav-and-slow-action");

  let currentSearchParams = page
    .getByRole("row")
    .filter({ hasText: "Current search params:" });
  let optimisticSearchParams = page
    .getByRole("row")
    .filter({ hasText: "Optimistic search params:" });
  let transitioning = page
    .getByRole("row")
    .filter({ hasText: "Router is transitioning:" });

  await page
    .getByRole("button", { name: "Nav and slow action", exact: true })
    .click();

  await expect(transitioning).toContainText("YES");
  await expect(currentSearchParams).not.toContainText("time=");
  await expect(optimisticSearchParams).toContainText(/time=\d+/);

  let optimisticSearchParamsText = await optimisticSearchParams.textContent();
  let time = optimisticSearchParamsText?.match(/time=\d+/)?.[0];
  if (!time) {
    throw new Error("Expected optimistic search params to include a timestamp");
  }

  await expect(page).toHaveURL(
    new RegExp(`/routing/use-optimistic-route/nav-and-slow-action\\?${time}$`),
  );
  await expect(currentSearchParams).toContainText(time);
  await expect(optimisticSearchParams).toContainText(time);
  await expect(transitioning).toContainText("NO");
});
