import { expect, test } from "../../test";

test.describe("page", () => {
  test("fetches data after middleware runs", async ({ page }) => {
    await page.goto("/http/api/middleware");
    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({
      middleware: true,
    });
  });
});

test.describe("API endpoint", () => {
  test("returns middleware data", async ({ request }) => {
    let response = await request.get("/http/api/middleware");

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ middleware: true });
  });
});
