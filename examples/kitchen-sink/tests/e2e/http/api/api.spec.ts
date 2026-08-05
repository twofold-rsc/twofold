import { expect, test } from "../../test";

test.describe("page", () => {
  test("fetches basic API data", async ({ page }) => {
    await page.goto("/http/api");

    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({ ok: true });
  });
});

test.describe("API endpoint", () => {
  test("returns basic data", async ({ request }) => {
    let response = await request.get("/http/api/basic");

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
