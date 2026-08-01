import { expect, test } from "../test";

test("navigates to the client action example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Client action", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/client");
  await expect(
    page.getByRole("heading", { name: "Client action" }),
  ).toBeVisible();
});

test("server-renders and hydrates the client action example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/client");

  await expect(page.getByText(/^The text on the server is .+$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update to: ABC" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("updates to hello world from a client component", async ({ page }) => {
  await page.goto("/server-actions/client");

  let text = page.getByTestId("server-text");
  await page.getByRole("button", { name: "Update to: hello world" }).click();

  await expect(text).toHaveText("hello world");
});

test("updates to hello world and back to ABC from a client component", async ({
  page,
}) => {
  await page.goto("/server-actions/client");

  let text = page.getByTestId("server-text");
  await page.getByRole("button", { name: "Update to: hello world" }).click();
  await expect(text).toHaveText("hello world");

  await page.getByRole("button", { name: "Update to: ABC" }).click();
  await expect(text).toHaveText("ABC");
});
