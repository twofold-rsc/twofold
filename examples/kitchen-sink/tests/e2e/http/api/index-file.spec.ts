import { expect, test } from "../../test";

test.describe("page", () => {
  test("fetches an index API route", async ({ page }) => {
    await page.goto("/http/api/index-file");
    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();

    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({
      ok: true,
      index: true,
    });
  });
});

test.describe("API endpoint", () => {
  test("returns index route data", async ({ request }) => {
    let response = await request.get("/http/api/nested");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true, index: true });
  });
});
