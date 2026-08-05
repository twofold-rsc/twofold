import { expect, test } from "../test";

test("navigates to the cookies example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Cookies", { exact: true }).click();

  await expect(page).toHaveURL("/http/cookies");
  await expect(page.getByRole("heading", { name: "Cookies" })).toBeVisible();
});

test("server-renders and hydrates the cookies example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/cookies");

  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Cookie value")).toBeVisible();

  verifyNoErrors();
});

test("creates and persists a cookie", async ({ page }) => {
  await page.goto("/http/cookies");

  await page.getByPlaceholder("Cookie value").fill("first-value");
  await page.getByRole("button", { name: "Set cookie" }).click();
  await expect(page.getByText("first-value", { exact: true })).toBeVisible();
  expect(
    (await page.context().cookies()).find(({ name }) => name === "my-cookie"),
  ).toMatchObject({
    name: "my-cookie",
    value: "first-value",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });

  await page.reload();
  await expect(page.getByText("first-value", { exact: true })).toBeVisible();

  await page.goto("/");
  await page.goto("/http/cookies");
  await expect(page.getByText("first-value", { exact: true })).toBeVisible();
});

test("updates and persists a cookie", async ({ page }) => {
  await page.goto("/http/cookies");

  await page.getByPlaceholder("Cookie value").fill("first value");
  await page.getByRole("button", { name: "Set cookie" }).click();
  await expect(page.getByText("first value", { exact: true })).toBeVisible();

  await page.getByPlaceholder("Cookie value").fill("updated value");
  await page.getByRole("button", { name: "Set cookie" }).click();
  await expect(page.getByText("updated value", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText("updated value", { exact: true })).toBeVisible();
});

test("destroys a cookie", async ({ page }) => {
  await page.goto("/http/cookies");

  await page.getByPlaceholder("Cookie value").fill("value to destroy");
  await page.getByRole("button", { name: "Set cookie" }).click();
  await expect(
    page.getByText("value to destroy", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Destroy cookie" }).click();
  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
  expect(
    (await page.context().cookies()).some(({ name }) => name === "my-cookie"),
  ).toBe(false);

  await page.reload();
  await expect(page.getByText("Cookie not set", { exact: true })).toBeVisible();
});
