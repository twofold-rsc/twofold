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
  await expect(
    page.getByText("No number selected. Click on a number to select it."),
  ).toBeVisible();

  verifyNoErrors();
});

test("renders a route behind the masked URL", async ({ page }) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 1" }).click();

  await expect(page).toHaveURL("/routing/masking/1");
  await expect(page.getByText("Selected number: 1")).toBeVisible();
  await expect(page.getByTestId("router-path")).toHaveText(
    "/routing/masking?number=1",
  );
  await expect(page.getByTestId("router-mask")).toHaveText(
    "/routing/masking/1",
  );
});

test("refreshes a masking page without changing its masked URL", async ({
  page,
}) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 2" }).click();
  await page.getByRole("button", { name: "Refresh" }).click();

  await expect(page).toHaveURL("/routing/masking/2");
  await expect(page.getByText("Selected number: 2")).toBeVisible();
  await expect(page.getByTestId("router-path")).toHaveText(
    "/routing/masking?number=2",
  );
  await expect(page.getByTestId("router-mask")).toHaveText(
    "/routing/masking/2",
  );
});

test("updates the count while retaining the masked page", async ({ page }) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 3" }).click();

  let count = page.getByText(/^Current count \d+$/);
  let currentCount = await count.textContent();
  let currentValue = Number(currentCount?.match(/\d+$/)?.[0]);

  await page.getByRole("button", { name: "Increment count" }).click();

  await expect(count).toHaveText(`Current count ${currentValue + 1}`);
  await expect(page).toHaveURL("/routing/masking/3");
});

test("generates a random number while retaining the masked page", async ({
  page,
}) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 1" }).click();
  await page.getByRole("button", { name: "Random number" }).click();

  await expect(page.getByText(/^Random number: [1-9]\d?$/)).toBeVisible();
  await expect(page).toHaveURL("/routing/masking/1");
});

test("loads a route directly without a mask", async ({ page }) => {
  await page.goto("/routing/masking/3");

  await expect(page).toHaveURL("/routing/masking/3");
  await expect(page.getByText("Selected number: 3")).toBeVisible();
  await expect(
    page.getByText("This page renders the clicked links without route masks."),
  ).toBeVisible();
  await expect(page.getByTestId("router-path")).toHaveText(
    "/routing/masking/3",
  );
  await expect(page.getByTestId("router-mask")).toHaveText("");
});

test("clears the mask after a browser reload", async ({ page }) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 3" }).click();

  await expect(page.getByTestId("router-mask")).toHaveText(
    "/routing/masking/3",
  );

  await page.reload();

  await expect(page).toHaveURL("/routing/masking/3");
  await expect(page.getByTestId("router-mask")).toHaveText("");
});

test("restores the masked route when navigating back", async ({ page }) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 1" }).click();
  await expect(page).toHaveURL("/routing/masking/1");
  await page.getByRole("link", { name: "Number 2" }).click();
  await expect(page).toHaveURL("/routing/masking/2");

  await page.goBack();

  await expect(page).toHaveURL("/routing/masking/1");
  await expect(page.getByTestId("router-path")).toHaveText(
    "/routing/masking?number=1",
  );
  await expect(page.getByTestId("router-mask")).toHaveText(
    "/routing/masking/1",
  );
});

test("restores a masked route when navigating back after a reload", async ({
  page,
}) => {
  await page.goto("/routing/masking");
  await page.getByRole("link", { name: "Number 1" }).click();
  await expect(page).toHaveURL("/routing/masking/1");
  await page.getByRole("link", { name: "Number 2" }).click();
  await expect(page).toHaveURL("/routing/masking/2");

  await page.reload();
  await expect(page).toHaveURL("/routing/masking/2");
  await expect(page.getByTestId("router-mask")).toHaveText("");

  await page.goBack();
  await expect(page).toHaveURL("/routing/masking/1");
  await expect(page.getByText("Selected number: 1")).toBeVisible();
  await expect(page.getByTestId("router-path")).toHaveText(
    "/routing/masking?number=1",
  );
  await expect(page.getByTestId("router-mask")).toHaveText(
    "/routing/masking/1",
  );
});
