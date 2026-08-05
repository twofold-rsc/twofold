import { expect, test } from "../../test";

test.describe("page", () => {
  test("follows an API redirect", async ({ page }) => {
    await page.goto("/http/api/redirect");

    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({
      ok: true,
    });
  });
});

test.describe("API endpoint", () => {
  test("redirects to the basic API", async ({ request }) => {
    let response = await request.get("/http/api/redirect", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toBe("/http/api/basic");
  });

  test("follows the redirect to the basic API", async ({ request }) => {
    let response = await request.get("/http/api/redirect");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
