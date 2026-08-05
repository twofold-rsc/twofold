import { expect, test } from "../test";

test("navigates to the request forwarding example", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Examples" }).click();
  await page.getByRole("button", { name: "HTTP" }).click();
  await page.getByText("Request forwarding", { exact: true }).click();

  await expect(page).toHaveURL("/http/request-forwarding");
  await expect(
    page.getByRole("heading", { name: "Request forwarding" }),
  ).toBeVisible();
});

test("server-renders and hydrates the request forwarding example", async ({
  page,
  verifyNoErrors,
}) => {
  await page.goto("/http/request-forwarding");

  await expect(
    page.getByText(
      "Requests passed to pages from proxies and load balancers will have the correct url, host, and protocol.",
    ),
  ).toBeVisible();

  verifyNoErrors();
});

test("uses forwarded host and protocol for page requests", async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-host": "proxy.example.test",
    "x-forwarded-proto": "https",
  });

  await page.goto("/http/request-forwarding");

  await expect(page.getByTestId("request-url")).toHaveText(
    "https://proxy.example.test/http/request-forwarding",
  );
  await expect(page.getByTestId("forwarded-host")).toHaveText(
    "proxy.example.test",
  );
  await expect(page.getByTestId("url-host")).toHaveText("proxy.example.test");
  await expect(page.getByTestId("forwarded-protocol")).toHaveText("https");
  await expect(page.getByTestId("url-protocol")).toHaveText("https:");
});
