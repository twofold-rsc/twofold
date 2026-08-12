import { expect, test } from "../test";

test("server-renders and hydrates the progressive MPA example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/uis/mpa");

  await expect(
    page.getByRole("heading", { name: "Progressive RSC" }),
  ).toBeVisible();
  await expect(page.getByText("JavaScript is enabled")).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  verifyNoErrors();
});

test("navigates to the progressive MPA example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "UIs" }).click();
  await page.getByRole("link", { name: /^Progressive/ }).click();

  await expect(page).toHaveURL("/uis/mpa");
  await expect(
    page.getByRole("heading", { name: "Progressive RSC" }),
  ).toBeVisible();
});

test.describe("JavaScript enabled", () => {
  test("shows an error for an unavailable username", async ({ page }) => {
    await page.goto("/uis/mpa");

    await page.getByLabel("Username").fill("alice");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Error: Username is already taken"),
    ).toBeVisible();
    await expect(page.getByLabel("Username")).toHaveValue("alice");
  });

  test("signs up with an available username", async ({ page }) => {
    await page.goto("/uis/mpa");

    await page.getByLabel("Username").fill("ryanto");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Success! You have signed up for an account."),
    ).toBeVisible();
  });
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("renders with JavaScript disabled", async ({ page }) => {
    await page.goto("/uis/mpa");

    await expect(page.getByText("JavaScript is disabled")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
  });

  test("shows an error for an unavailable username", async ({ page }) => {
    await page.goto("/uis/mpa");

    await page.getByLabel("Username").fill("alice");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Error: Username is already taken"),
    ).toBeVisible();
    await expect(page.getByLabel("Username")).toHaveValue("alice");
  });

  test("signs up with an available username", async ({ page }) => {
    await page.goto("/uis/mpa");

    await page.getByLabel("Username").fill("ryanto");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText("Success! You have signed up for an account."),
    ).toBeVisible();
  });
});
