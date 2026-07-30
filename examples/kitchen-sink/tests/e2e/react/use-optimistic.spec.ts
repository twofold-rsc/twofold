import { expect, test } from "../test";

test("navigates to the useOptimistic example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "useOptimistic" }).click();

  await expect(page).toHaveURL("/react/use-optimistic");
  await expect(
    page.getByRole("heading", { name: "useOptimistic" }),
  ).toBeVisible();
});

test("server-renders and hydrates the useOptimistic example", async ({
  page,
  verifyNoHydrationErrors,
}) => {
  await page.goto("/react/use-optimistic");

  await expect(page.getByText("Buy milk", { exact: true })).toBeVisible();
  await expect(page.getByText("Do laundry", { exact: true })).toBeVisible();

  verifyNoHydrationErrors();
});

test("shows an optimistic todo until the server action settles", async ({
  page,
}) => {
  let task = `Write optimistic test ${Date.now()}`;

  await page.goto("/react/use-optimistic");
  await page.getByPlaceholder("Enter a task").fill(task);
  await page.getByRole("button", { name: "Add todo" }).click();

  let todo = page.getByRole("listitem").filter({ hasText: task });
  await expect(todo).toContainText("(pending)");

  await expect
    .poll(
      async () => {
        if ((await todo.count()) === 0) {
          return "removed";
        }

        return (await todo.textContent())?.includes("(pending)")
          ? "pending"
          : "saved";
      },
      { timeout: 5_000 },
    )
    .toMatch(/^(removed|saved)$/);
});
