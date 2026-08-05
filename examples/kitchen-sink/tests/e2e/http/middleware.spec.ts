import { expect, test } from "../test";

test("navigates to the middleware example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Middleware", { exact: true }).click();

  await expect(page).toHaveURL("/http/middleware");
  await expect(
    page.getByRole("heading", { name: "Middleware", level: 1 }),
  ).toBeVisible();
});

test("server-renders and hydrates the middleware example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/middleware");

  await expect(
    page.getByRole("heading", { name: "Middleware", level: 1 }),
  ).toBeVisible();

  verifyNoErrors();
});

test.describe("before middleware", () => {
  test("runs page middleware", async ({ page }) => {
    await page.goto("/http/middleware");

    await expect
      .poll(async () => {
        let cookie = (await page.context().cookies()).find(
          ({ name }) => name === "ran-middleware",
        );

        return cookie?.value;
      })
      .toBe("true");
  });

  test("runs layout middleware", async ({ page }) => {
    await page.goto("/http/middleware");

    await expect
      .poll(async () => {
        let cookie = (await page.context().cookies()).find(
          ({ name }) => name === "ran-layout-middleware",
        );

        return cookie?.value;
      })
      .toBe("true");
  });

  test("passes the request URL to middleware props", async ({ page }) => {
    await page.goto("/http/middleware/props?source=playwright");

    await expect
      .poll(async () => {
        let cookie = (await page.context().cookies()).find(
          ({ name }) => name === "middleware-request-url",
        );

        return decodeURIComponent(cookie?.value ?? "");
      })
      .toBe(page.url());
  });
});

test.describe("global middleware", () => {
  test("runs global middleware", async ({ page }) => {
    await page.goto("/http/middleware/global");

    await expect
      .poll(async () => {
        let cookie = (await page.context().cookies()).find(
          ({ name }) => name === "ran-global-middleware",
        );

        return cookie?.value;
      })
      .toBe("true");
  });

  test("follows the global middleware redirect", async ({ page }) => {
    await page.goto("/http/middleware/global-redirect");

    await expect(page).toHaveURL("/http/middleware/global-redirect-end");
    await expect(
      page.getByText(
        "You have been redirected here by the global middleware.",
        { exact: true },
      ),
    ).toBeVisible();
  });
});
