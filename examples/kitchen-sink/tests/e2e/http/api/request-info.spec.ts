import { expect, test } from "../../test";

test.describe("page", () => {
  test("fetches request information", async ({ page }) => {
    await page.goto("/http/api/request-info");

    await page.getByRole("button", { name: "Fetch data" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toHaveProperty(
      "host",
    );
  });
});

test.describe("API endpoint", () => {
  test("echoes request headers", async ({ request }) => {
    let response = await request.get("/http/api/request-info", {
      headers: { "x-twofold-e2e-request-id": "request-info-unique-value" },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        "x-twofold-e2e-request-id": "request-info-unique-value",
      }),
    );
  });
});
