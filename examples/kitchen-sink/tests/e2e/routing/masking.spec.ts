import { expect, test } from "../test";

test("navigates to the route masking example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Routing" }).click();
  await page.getByText("Masking", { exact: true }).click();

  await expect(page).toHaveURL("/routing/masking");
  await expect(
    page.getByRole("heading", { name: "Route masking" }),
  ).toBeVisible();
});

test("server-renders and hydrates masked links", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/routing/masking");

  let numberOne = page.getByRole("link", { name: "Number 1" });
  await expect(numberOne).toHaveAttribute("href", "/routing/masking/1");
  await expect(
    page.getByText("No number selected. Click on a number to select it."),
  ).toBeVisible();

  await numberOne.click();

  await expect(page).toHaveURL("/routing/masking/1");
  await expect(page.getByText("Selected number: 1")).toBeVisible();
  await expect(
    page.getByText("/routing/masking?number=1", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("/routing/masking/1", { exact: true }),
  ).toBeVisible();
  verifyNoErrors();
});

test("supports masked navigation from the router and browser history", async ({
  page,
}) => {
  await page.goto("/routing/masking");

  await page.getByRole("button", { name: "Number 4" }).click();
  await expect(page).toHaveURL("/routing/masking/4");
  await expect(page.getByText("Selected number: 4")).toBeVisible();

  await page.getByRole("link", { name: "Number 2" }).click();
  await expect(page).toHaveURL("/routing/masking/2");
  await expect(page.getByText("Selected number: 2")).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL("/routing/masking/4");
  await expect(page.getByText("Selected number: 4")).toBeVisible();
  await expect(
    page.getByText("/routing/masking?number=4", { exact: true }),
  ).toBeVisible();
});

test("loads a masked URL as its direct dynamic route", async ({ page }) => {
  await page.goto("/routing/masking/3");

  await expect(page).toHaveURL("/routing/masking/3");
  await expect(page.getByText("Selected number: 3")).toBeVisible();
  await expect(
    page.getByText("This page renders the clicked links without route masks."),
  ).toBeVisible();
});

test.skip("todo: preserve the visible masked URL when reloading a client-masked route", async () => {});
