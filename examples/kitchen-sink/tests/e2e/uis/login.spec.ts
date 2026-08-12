import { expect, test } from "../test";

test("server-renders and hydrates the login example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/uis/login");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveValue(
    "email@example.com",
  );
  await expect(page.getByLabel("Password")).toHaveValue("password");
  verifyNoErrors();
});

test("navigates to the login example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "UIs" }).click();
  await page.getByRole("link", { name: /^Login/ }).click();

  await expect(page).toHaveURL("/uis/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("shows an error for incorrect credentials", async ({ page }) => {
  await page.goto("/uis/login");

  await page.getByLabel("Email address").fill("wrong@example.com");
  await page.getByLabel("Password").fill("incorrect");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Invalid email and password")).toBeVisible();
  await expect(page.getByLabel("Email address")).toHaveValue(
    "wrong@example.com",
  );
  await expect(page.getByLabel("Password")).toHaveValue("incorrect");
  await expect(page).toHaveURL("/uis/login");
});

test("logs in with valid credentials", async ({ page }) => {
  await page.goto("/uis/login");
  await page.getByLabel("Email address").fill("email@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL("/uis/login/dashboard");
  await expect(page.getByText("Welcome to the dashboard page!")).toBeVisible();
});

test("redirects authenticated login visits to the dashboard", async ({ page }) => {
  await page.goto("/uis/login");
  await page.getByLabel("Email address").fill("email@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/uis/login/dashboard");

  await page.goto("/uis/login");

  await expect(page).toHaveURL("/uis/login/dashboard");
  await expect(page.getByText("Welcome to the dashboard page!")).toBeVisible();
});

test("redirects to the dashboard after reloading a restored login page", async ({
  page,
}) => {
  await page.goto("/uis/login");
  await page.getByLabel("Email address").fill("email@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/uis/login/dashboard");

  await page.goBack();

  await expect(page).toHaveURL("/uis/login");
  await page.reload();

  await expect(page).toHaveURL("/uis/login/dashboard");
  await expect(page.getByText("Welcome to the dashboard page!")).toBeVisible();
});

test("logs out", async ({ page }) => {
  await page.goto("/uis/login");
  await page.getByLabel("Email address").fill("email@example.com");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL("/uis/login/dashboard");

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL("/uis/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("redirects unauthenticated dashboard visits to login", async ({ page }) => {
  await page.goto("/uis/login/dashboard");

  await expect(page).toHaveURL("/uis/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});
