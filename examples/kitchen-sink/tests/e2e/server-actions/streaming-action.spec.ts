import { expect, test } from "../test";

test("navigates to the streaming action example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Streaming action", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/streaming-action");
  await expect(
    page.getByRole("heading", { name: "Streaming action" }),
  ).toBeVisible();
});

test("server-renders and hydrates the streaming action example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/streaming-action");

  await expect(page.getByTestId("result")).toHaveText("Result:");
  await expect(page.getByRole("button", { name: "Run stream" })).toBeVisible();

  verifyNoErrors();
});

test("renders each chunk from the stream", async ({ page }) => {
  await page.goto("/server-actions/streaming-action");

  let button = page.getByRole("button", { name: "Run stream" });
  let result = page.getByTestId("result");
  await button.click();

  await expect(button).toBeDisabled();
  await expect(result).toHaveText("Result: 1");
  await expect(result).toHaveText("Result: 1, 2, 3, 4, 5");
  await expect(button).toBeEnabled();
});
