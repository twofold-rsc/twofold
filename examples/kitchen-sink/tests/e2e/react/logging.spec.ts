import { expect, test } from "../test";

test("navigates to the Logging example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "React" }).click();
  await page.getByRole("link", { name: "Logging" }).click();

  await expect(page).toHaveURL("/react/logging");
  await expect(
    page.getByRole("heading", { name: "These should be escaped" }),
  ).toBeVisible();
});

test("server-renders and hydrates escaped logging output", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/react/logging");

  await expect(
    page.getByText("A string with some HTML: <b>Hello</b><script></script>", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Hello <b>world!</b><script></script>", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "This should contain HTML" }),
  ).toBeVisible();

  await expect(page.getByText("HTML", { exact: true })).toBeVisible();

  verifyNoErrors();
});

test(
  "forwards server logs to the browser console",
  { tag: "@development" },
  async ({ page }) => {
    let logs: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "log") {
        logs.push(message.text());
      }
    });

    await page.goto("/react/logging");

    let expectedLogs = [
      "Hello world!",
      "Hello <b>html</b> world!",
      "Hello <script></script> world!",
    ];

    await expect.poll(() =>
      expectedLogs.every((expectedLog) =>
        logs.some((log) => log.includes(expectedLog)),
      ),
    ).toBe(true);
  },
);
