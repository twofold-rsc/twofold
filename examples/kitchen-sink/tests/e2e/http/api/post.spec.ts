import { expect, test } from "../../test";

test.describe("page", () => {
  test("posts form data", async ({ page }) => {
    await page.goto("/http/api/post");

    await page.getByPlaceholder("Name").fill("Ada");
    await page.getByRole("button", { name: "Submit" }).click();

    let response = page.getByTestId("api-response");
    await expect(response).toBeVisible();
    expect(JSON.parse((await response.textContent()) ?? "")).toEqual({
      name: "Ada",
    });
  });
});

test.describe("API endpoint", () => {
  test("returns posted form data", async ({ request }) => {
    let response = await request.post("/http/api/basic", {
      multipart: { name: "Ada" },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ name: "Ada" });
  });
});
