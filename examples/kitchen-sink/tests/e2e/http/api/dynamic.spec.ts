import { expect, test } from "../../test";

test.describe("page", () => {
  test("fetches a dynamic API route", async ({ page }) => {
    await page.goto("/http/api/dynamic");

    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({
      ok: true,
      id: "123",
    });
  });
});

test.describe("API endpoint", () => {
  test("returns the dynamic parameter", async ({ request }) => {
    let response = await request.get("/http/api/nested/e2e-id");

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true, id: "e2e-id" });
  });
});
