import { expect, test } from "../test";

test("navigates to the bound object example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Bound object", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/bound-object");
  await expect(
    page.getByRole("heading", { name: "Bound object" }),
  ).toBeVisible();
});

test("server-renders and hydrates the bound object example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/bound-object");

  await expect(page.getByRole("textbox")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update name" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("updates a bound object", async ({ page }) => {
  await page.goto("/server-actions/bound-object");
  await page.getByRole("textbox").fill("carol");
  await page.getByRole("button", { name: "Update name" }).click();

  await expect(page.getByTestId("update-log")).toHaveText(
    /^Name changed from .+ to carol\. It was created .+\.$/,
  );
});

test("updates a bound object from bob to alice", async ({ page }) => {
  await page.goto("/server-actions/bound-object");

  let log = page.getByTestId("update-log");
  await page.getByRole("textbox").fill("bob");
  await page.getByRole("button", { name: "Update name" }).click();
  await expect(log).toHaveText(
    /^Name changed from .+ to bob\. It was created .+\.$/,
  );

  await page.getByRole("textbox").fill("alice");
  await page.getByRole("button", { name: "Update name" }).click();

  await expect(log).toHaveText(
    /^Name changed from bob to alice\. It was created .+\.$/,
  );
});
