import { expect, test } from "../test";

let toastMessage =
  /Action completed successfully|Your changes have been saved|Item added to cart|You have a new notification|Form successfully saved/;

test("navigates to the flash messages example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "Server actions" }).click();
  await page.getByText("Flash messages", { exact: true }).click();

  await expect(page).toHaveURL("/server-actions/flash-messages");
  await expect(
    page.getByRole("heading", { name: "Flash & Toast messages" }),
  ).toBeVisible();
});

test("server-renders and hydrates the flash messages example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/server-actions/flash-messages");

  await expect(
    page.getByRole("heading", { name: "Flash & Toast messages" }),
  ).toBeVisible();

  verifyNoErrors();
});

test("shows a toast", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Toast", exact: true }).click();

  let notifications = page.getByRole("region", {
    name: "Notifications (F8)",
  });
  await expect(notifications.getByText(toastMessage)).toBeVisible();
});

test("dismisses a toast", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Toast", exact: true }).click();

  let notifications = page.getByRole("region", {
    name: "Notifications (F8)",
  });
  await expect(notifications.getByRole("listitem")).toHaveCount(1);
  await notifications.getByRole("button").click();

  await expect(notifications.getByRole("listitem")).toHaveCount(0);
});

test("automatically dismisses a toast", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");

  let notifications = page.getByRole("region", {
    name: "Notifications (F8)",
  });
  await page.getByRole("button", { name: "Toast", exact: true }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(1);

  await expect(notifications.getByRole("listitem")).toHaveCount(0);
});

test("shows five toasts", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");

  let toast = page.getByRole("button", { name: "Toast", exact: true });
  await toast.click();
  await toast.click();
  await toast.click();
  await toast.click();
  await toast.click();

  await expect(
    page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByRole("listitem"),
  ).toHaveCount(5);
});

test("preserves a toast after reloading", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");

  let notifications = page.getByRole("region", {
    name: "Notifications (F8)",
  });
  await page.getByRole("button", { name: "Toast", exact: true }).click();
  await expect(notifications.getByRole("listitem")).toHaveCount(1);

  await page.reload();

  await expect(notifications.getByRole("listitem")).toHaveCount(1);
});

test("shows multiple toasts", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Multiple toasts" }).click();

  await expect(
    page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByRole("listitem"),
  ).toHaveCount(3);
});

test("redirects and shows a toast", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Redirect and toast" }).click();

  await expect(page).toHaveURL("/server-actions/flash-messages/end");
  await expect(page.getByText("Redirect complete.")).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByText(toastMessage),
  ).toBeVisible();
});

test("shows a client side toast", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Client side toast" }).click();

  await expect(
    page
      .getByRole("region", { name: "Notifications (F8)" })
      .getByText("This is a client side flash message", { exact: true }),
  ).toBeVisible();
});

test("shows an object flash", async ({ page }) => {
  await page.goto("/server-actions/flash-messages");
  await page.getByRole("button", { name: "Object flash" }).click();

  await expect(page.getByText("Hello", { exact: true })).toBeVisible();
});
