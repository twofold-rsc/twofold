import { expect, test } from "../test";

test.describe("JavaScript enabled", () => {
  test("navigates to the MPA example", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Examples" }).click();
    await page.getByRole("button", { name: "Server actions" }).click();
    await page.getByText("MPA", { exact: true }).click();

    await expect(page).toHaveURL("/server-actions/mpa");
    await expect(
      page.getByRole("heading", { name: "MPA + Form" }),
    ).toBeVisible();
  });

  test("server-renders and hydrates the MPA example", async ({
    page,
    verifyNoErrors,
  }) => {
    await page.goto("/server-actions/mpa");

    await expect(page.getByTestId("count")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeVisible();
    await expect(page.getByText("Action that redirects")).toBeVisible();

    verifyNoErrors();
  });

  test("increments the server state", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let count = page.getByTestId("count");
    let initialCount = Number(await count.textContent());
    await page
      .getByText("Form with server state")
      .locator("..")
      .getByRole("button", {
        name: "Increment",
      })
      .click();

    await expect(count).toHaveText(String(initialCount + 1));
  });

  test("submits the client state form", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let form = page.getByText("Form with client state").locator("..");
    await form.getByRole("textbox").fill("alice");
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(form.getByText("Success!")).toBeVisible();
  });

  test("redirects after submitting the redirect action", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let form = page.getByText("Action that redirects").locator("..");
    await form.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("/server-actions/mpa?redirected=true");
    await expect(page.getByText("Redirected")).toBeVisible();
  });

  test("surfaces an error from an action", async ({ page }, testInfo) => {
    await page.goto("/server-actions/mpa");
    let form = page.getByText("Action that errors").locator("..");
    await form.getByRole("button", { name: "Run action" }).click();

    if (testInfo.project.metadata.environment === "production") {
      await expect(
        page.getByRole("heading", { name: "Application error", exact: true }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Error" })).toBeVisible();
      await expect(
        page.getByText("This action threw an error", { exact: true }),
      ).toBeVisible();
    }
  });
});

test.describe("JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("renders the MPA example", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    await expect(
      page.getByRole("heading", { name: "MPA + Form" }),
    ).toBeVisible();
    await expect(page.getByTestId("count")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("increments the server state", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let count = page.getByTestId("count");
    let initialCount = Number(await count.textContent());
    await page
      .getByText("Form with server state")
      .locator("..")
      .getByRole("button", {
        name: "Increment",
      })
      .click();

    await expect(count).toHaveText(String(initialCount + 1));
  });

  test("submits the client state form", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let form = page.getByText("Form with client state").locator("..");
    await form.getByRole("textbox").fill("alice");
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(form.getByText("Success!")).toBeVisible();
  });

  test("redirects after submitting the redirect action", async ({ page }) => {
    await page.goto("/server-actions/mpa");

    let form = page.getByText("Action that redirects").locator("..");
    await form.getByRole("button", { name: "Run action" }).click();

    await expect(page).toHaveURL("/server-actions/mpa?redirected=true");
    await expect(page.getByText("Redirected")).toBeVisible();
  });

  test("surfaces an error from an action", async ({ page }, testInfo) => {
    await page.goto("/server-actions/mpa");
    let form = page.getByText("Action that errors").locator("..");
    await form.getByRole("button", { name: "Run action" }).click();

    if (testInfo.project.metadata.environment === "production") {
      await expect(
        page.getByRole("heading", { name: "Application error", exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: "This action threw an error" }),
      ).toBeVisible();
    }
  });
});
