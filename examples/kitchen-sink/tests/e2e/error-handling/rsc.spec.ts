import { expect, test } from "../test";

test("shows an error when an RSC throws", async ({ page }) => {
  await page.goto("/error-handling/rsc/rsc-throw");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when navigating to an RSC that throws", async ({
  page,
}) => {
  await page.goto("/error-handling/rsc");
  await page.getByRole("link", { name: "RSC throw", exact: true }).click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-throw");
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when an async RSC throws", async ({ page }) => {
  await page.goto("/error-handling/rsc/rsc-async-throw");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when navigating to an async RSC that throws", async ({
  page,
}) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC async throw", exact: true })
    .click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-async-throw");
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when an RSC promise rejects", async ({ page }) => {
  await page.goto("/error-handling/rsc/rsc-async-reject");

  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when navigating to an RSC promise that rejects", async ({
  page,
}) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC async reject", exact: true })
    .click();

  await expect(page).toHaveURL("/error-handling/rsc/rsc-async-reject");
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when a suspended RSC throws", async ({ page }) => {
  await page.goto("/error-handling/rsc/rsc-suspended-throw", {
    waitUntil: "commit",
  });

  await expect(page.getByTestId("suspense-fallback")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

test("shows an error when navigating to a suspended RSC that throws", async ({
  page,
}) => {
  await page.goto("/error-handling/rsc");
  await page
    .getByRole("link", { name: "RSC suspended throw", exact: true })
    .click();

  await expect(page.getByTestId("suspense-fallback")).toBeVisible();
  await expect(page).toHaveURL("/error-handling/rsc/rsc-suspended-throw");
  await expect(
    page.getByRole("heading", { name: "Error", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("error-message")).toContainText("Oh no!");
});

// The timer throws outside the request promise, leaving the request pending and
// potentially terminating the shared development server instead of rendering UI.
// test.skip("shows an error when an RSC throws out of band", async ({
//   page,
// }) => {
//   await page.goto("/error-handling/rsc/rsc-async-oob-throw");
//
//   await expect(
//     page.getByRole("heading", { name: "Error", exact: true }),
//   ).toBeVisible();
//   await expect(page.getByTestId("error-message")).toContainText("Oh no!");
// });

// The timer throws outside the request promise, leaving navigation pending and
// potentially terminating the shared development server instead of rendering UI.
// test.skip("shows an error when navigating to an RSC that throws out of band", async ({
//   page,
// }) => {
//   await page.goto("/error-handling/rsc");
//   await page
//     .getByRole("link", { name: "RSC async out-of-band throw", exact: true })
//     .click();
//
//   await expect(
//     page.getByRole("heading", { name: "Error", exact: true }),
//   ).toBeVisible();
//   await expect(page.getByTestId("error-message")).toContainText("Oh no!");
// });
